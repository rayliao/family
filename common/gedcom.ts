import fs from 'fs'
const FILE_NAME = 'rayliao'

interface DataItem {
  [key: string]: string | DataItem
}
export interface GedcomData {
  HEAD: DataItem
  INDI: DataItem
  FAM: DataItem
  TRLR: DataItem
}

const dataCache = new Map<string, GedcomData>()

const generateData = (fileName: string = FILE_NAME) => {
  const fileData = fs.readFileSync(`public/${fileName}.ged`, 'utf-8')
  const data: GedcomData = {
    HEAD: {},
    INDI: {},
    FAM: {},
    TRLR: {},
  }
  let tag = ''
  let id = ''
  let tag2 = ''
  let tag3 = ''
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
          if (tag === 'HEAD' || tag === 'TRLR') {
            data[tag][tag2] = value
          } else {
            data[tag][id][tag2] = value
          }
          break
        case '2':
          tag3 = second
          if (tag === 'HEAD' || tag === 'TRLR') {
            data[tag][tag2][tag3] = value
          } else {
            data[tag][id][tag2][tag3] = value
          }
          break
      }
    }
  })
  dataCache.set(fileName, data)
  return data
}

/**
 * get gedcom data from file or cache
 */
export const getGedcom = (fileName: string = FILE_NAME) => {
  const hasCache = dataCache.has(fileName)
  return hasCache ? dataCache.get(fileName) : generateData(fileName)
}

/**
 * save data to gedcom file
 */
export const saveGedcom = async (fileName: string = FILE_NAME) => {
  try {
    if (dataCache.has(fileName)) {
      const tt: GedcomData = {
        HEAD: {
          VERSION: '5.5.1',
          GEDC: '5.5.1',
        },
        INDI: {
          '@I0001': {
            NAME: 'Rayliao',
            GIVN: 'Rayliao',
          },
          '@I0002': {
            NAME: 'Rayliao',
            BIRTH: {
              DATE: '1850',
              PLAC: 'sdf',
            },
          },
        },
        FAM: {},
        TRLR: {},
      }
      const data = dataCache.get(fileName)
      const result: string[] = []
      const head = ['0 HEAD']
      const indi: string[] = []
      const fam: string[] = []
      const subm: string[] = []
      const recursionData = (data, index = 0) => {
        for (const k in data) {
          const value = data[k]
          if (k === 'HEAD' || k === 'TRLR') {
            result.push(`0 ${k}`)
          }
          if (typeof value === 'string') {
            result.push(`${index} ${k} ${data[k]}`)
          } else {
            recursionData(data[k], index + 1)
          }
        }
      }
      for (const k in data) {
        if (k === 'HEAD' || k === 'TRLR') {
          result.push(`0 ${k}`)
        }
        for (const kk in data[k]) {
          if (k === 'INDI' || k === 'FAM') {
            result.push(`0 ${kk} @${k}`)
          }
          if (typeof data[k][kk] === 'string') {
            result.push(`1 ${kk} ${data[k][kk]}`)
          }
        }
      }
      const all = head.concat(subm, indi, fam).join('\n')
      fs.writeFileSync(`public/${fileName}.ged`, all)
    } else {
      return false
    }
  } catch {
    return false
  }
}
