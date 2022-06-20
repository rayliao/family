import fs from 'fs'
import { readGedcom, SelectionHeader } from 'read-gedcom'

const FILE_NAME = 'pres2020'
let fileCache: {
  [key: string]: ArrayBuffer
} = {}
let gedData: {
  [key: string]: GedcomData
} = {}

const generateData = () => {
  const fileData = fs.readFileSync('public/liao.ged', 'utf-8')
  const data = {
    HEAD: {},
    SUBM: {},
    INDI: {},
    FAM: {},
  }
  let tag = ''
  let id = ''
  let tag2 = ''
  let tag3 = ''
  let preData: string[] = []
  fileData.split('\n').forEach((line) => {
    if (line.trim()) {
      const [index, second, ...third] = line.split(' ')
      const value = third ? third.join(' ') : ''
      switch (index) {
        case '0':
          id = second
          tag = value || second
          if (value) {
            data[tag][id] = {}
          }
          break
        case '1':
          tag2 = second
          console.log(data)
          if (tag === 'HEAD') {
            data[tag][tag2] = value
          } else {
            data[tag][id][tag2] = value
          }
          break
        case '2':
          tag3 = second
          if (tag === 'HEAD') {
            data[tag][tag2][tag3] = value
          } else {
            data[tag][id][tag2][tag3] = value
          }
          break
      }
      preData = [index, second, value]
    }
  })
  console.log(data)
}

/**
 * get gedcom data by read
 */
export const getGedcom = (fileName: string = FILE_NAME) => {
  try {
    const hasCache = fileCache.hasOwnProperty(fileName)
    const hasData = gedData.hasOwnProperty(fileName)
    generateData()
    const data = hasCache
      ? fileCache[fileName]
      : fs.readFileSync(`public/${fileName}.ged`, null).buffer
    const result = readGedcom(data)
    // if (!hasData) {
    //   const h = result.getHeader()
    //   const head = {}
    //   h[0].children
    //     .filter((c) => c.tag)
    //     .forEach((c) => {
    //       if (c.children.length > 0) {
    //         const cv = {
    //           value: c.value,
    //         }
    //         c.children
    //           .filter((cc) => cc.tag)
    //           .forEach((cc) => {
    //             cv[cc.tag!] = cc.value
    //           })
    //         head[c.tag!] = cv
    //       } else {
    //         head[c.tag!] = c.value
    //       }
    //     })
    //   const s = result.getSubmitterRecord()
    //   const subm = {}
    //   s.arraySelect().forEach((item) => {
    //     const childs = {}
    //     item[0].children.forEach((c) => {
    //       childs[c.tag!] = c.value
    //     })
    //     subm[item.pointer] = childs
    //   })
    // }
    return result
  } catch {
    return null
  }
}

export interface GedcomData {
  head: { [key: string]: string }
  subm: { [key: string]: { [key: string]: string } }
  indi: { [key: string]: { [key: string]: string } }
  fam: { [key: string]: { [key: string]: string } }
}

export const saveGedcom = async (fileName: string = FILE_NAME) => {
  const data = gedData[fileName]
  const head = ['0 HEAD']
  const subm: string[] = []
  const indi: string[] = []
  const fam: string[] = []
  for (const d in data) {
    switch (d) {
      case 'head':
        for (const h in data.head) {
          head.push(`1 ${h} ${data.head[h]}`)
        }
        break
      case 'subm':
        for (const s in data.subm) {
          subm.push(`0 ${s} SUBM`)
          for (const ss in data.subm[s]) {
            subm.push(`1 ${ss} ${data.subm[s][ss]}`)
          }
        }
        break
      case 'indi':
        for (const i in data.indi) {
          indi.push(`0 ${i} INDI`)
          for (const ii in data.indi[i]) {
            indi.push(`1 ${ii} ${data.indi[i][ii]}`)
          }
        }
        break
      case 'fam':
        for (const f in data.fam) {
          fam.push(`0 ${f} FAM`)
          for (const ff in data.fam[f]) {
            fam.push(`1 ${ff} ${data.fam[f][ff]}`)
          }
        }
    }
  }
  const all = head.concat(subm, indi, fam).join('\n')
  fileCache[fileName] = await new Blob([all], {
    type: 'text/plain;charset=utf-8',
  }).arrayBuffer()
  fs.writeFileSync(`public/${fileName}.ged`, all)
}
