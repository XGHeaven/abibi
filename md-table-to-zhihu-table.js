const readline = require('readline')
const os = require('os')
const fs = require('fs')

const mdTable = fs.readFileSync('table.md', 'utf8')

const lines = mdTable.split('\n').map(t => t.trim()).filter(Boolean).map(line => {
  if (line[0] === '|') {
    line = line.substr(1)
  }

  if (line[line.length - 1] === '|') {
    line = line.substr(0, line.length - 2)
  }

  const columns = line.split('|').map(t => t.trim())
  return columns
})

const columnSize = lines[0].length

const output = `\\begin{array}{${lines[0].map(() => 'l').join('')}}
${lines[0].join('&')}\\\\
${lines.slice(2).map(line => line.join('&')+'\\\\').join('\n')}
\\end{array}`

fs.writeFileSync('zhihu-table.txt', output, 'utf8')

