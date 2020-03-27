import fs from 'fs'
import CommonMark from 'commonmark'
import remark from 'remark-parse'
import remarkStringify from 'remark-stringify'
import unified from 'unified'
import path from 'path'
import treeMap from 'unist-util-map'
import csv from 'csv-parse/lib/sync.js'

const filePathArgv = process.argv[2]
if (!filePathArgv) {
  console.error('please give filepath')
  process.exit(0)
}

const filePath = path.resolve(process.cwd(), filePathArgv)
// console.log(filePath)

const source = fs.readFileSync(filePath, 'utf8')

function createProcessor() {
  return unified()
  .use(remark, {commonmark: true})
  .use(function() {
    const transTo = this.data('transTo') || 'juejin'
    return (tree, file) => {
      // console.log(tree)
      const title = tree.children && tree.children[0]
      if (title && title.type === 'heading' && title.depth === 1) {
        // 整个文章的标题，直接删除即可
        tree.children.shift()
      }

      if (transTo !== 'zhihu') {
        tree.children.unshift({
          type: 'html',
          value: '<small>本文首发于<a href="https://www.zhihu.com/people/XGHeaven">知乎</a>，其他平台自动同步</small>'
        })
      }

      return treeMap(tree, node => {
        if (node.type === 'link') {
          // console.log(node)
          const destFilePath = node.url

          if (path.extname(destFilePath) === '.csv') {
            const csvContent = fs.readFileSync(path.resolve(path.dirname(filePath), decodeURI(destFilePath)), 'utf8')
            const lines = csv(csvContent)
            // console.log(lines)
            // const lines = csvContent.split('\n').filter(Boolean).map(line => line.split(',').map(v => v.trim()))
            const column = lines[0].length
            let value = ''
            if (transTo === 'zhihu') {
              const latex = `\\begin{array}{${lines[0].map(() => 'l').join('')}}${lines[0].join('&')}\\\\${lines.slice(1).map(line => line.join('&')+'\\\\').join('')}\\end{array}`.replace(/\%/g, '\\%')
              value = `<img src="https://www.zhihu.com/equation?tex=${latex}" alt="${latex}" class="ee_img tr_noresize" eeimg="1">`
            } else {
              value = `
| ${lines[0].join(' | ')} |
| ${lines[0].map(() => '---').join(' | ')} |
${lines.slice(1).map(line => `| ${line.join(' | ')} |`).join('\n')}
`.trim()
            }
            return Object.assign({}, node, {
              type: 'html',
              value
            })
          }
        }

        return node
      })
    }
  })
  .use(remarkStringify, {
    listItemIndent: 1
  })
}

const juejin = createProcessor().data('transTo', 'juejin').processSync(source)
fs.writeFileSync(path.resolve(path.dirname(filePath), 'juejin.md'), juejin.contents, 'utf8')

const zhihu = createProcessor().data('transTo', 'zhihu').processSync(source)
fs.writeFileSync(path.resolve(path.dirname(filePath), 'zhihu.md'), zhihu.contents, 'utf8')

// console.log(processor.stringify(node))

process.exit(0)

const parser = new CommonMark.Parser({})
const tree = parser.parse(source)

const walker = tree.walker()

while(true) {
  const step = walker.next()
  if (!step) {
    break
  }
  if (step.entering === null) {
    break
  }

  if (step.entering === false) {
    continue
  }

  const {node} = step

  if (node.type === 'link') {
    const destFilePath = node.destination
    if (path.extname(destFilePath) === '.csv') {
      console.log(node.title, destFilePath)
      const csvContent = fs.readFileSync(path.resolve(path.dirname(filePath), decodeURI(destFilePath)), 'utf8')
      const lines = csvContent.split('\n').filter(Boolean).map(line => line.split(','))
      const column = lines[0].length
      node.insertBefore(parser.parse(`
      | ${lines[0].join(' | ')} |
      | ${lines[0].map(() => '---').join(' | ')} |
      ${lines.slice(2).map(line => `| ${line.join(' | ')} |`).join('\n')}
      `))
      node.unlink()
    }
  }
}

console.log(tree.toString())
