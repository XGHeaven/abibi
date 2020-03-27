const fs = require('fs')

const csv = fs.readFileSync('table.csv', 'utf8')

const lines = csv.split('\n').filter(Boolean).map(line => line.split(','))
const column = lines[0].length

const mdTable = `
| ${lines[0].join(' | ')} |
| ${lines[0].map(() => '---').join(' | ')} |
${lines.slice(2).map(line => `| ${line.join(' | ')} |`).join('\n')}
`
const latexTable = `\\begin{array}{${lines[0].map(() => 'l').join('')}}
${lines[0].join('&')}\\\\
${lines.slice(2).map(line => line.join('&')+'\\\\').join('\n')}
\\end{array}`

fs.writeFileSync('table.md', `${mdTable}
${latexTable}`, 'utf8')
