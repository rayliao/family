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
  let tag2 = ''
  let tag3 = ''
  let item: any = {}
  let parent: any = undefined
  let preItem: any = undefined
  fileData.split('\n').forEach((line) => {
    if (line.trim()) {
      const [index, second, ...third] = line.split(' ')
      const value = third ? third.join(' ') : ''
      if (index === '0') {
        if (tag) {
          data[tag] = {
            ...data[tag],
            ...item,
          }
          item = {}
        }
        tag = second
        if (value) {
          tag = value
          item.id = second
        }
        parent = undefined
        preItem = undefined
      } else {
        if (parent) {
          item[parent.second][second] = value
        } else {
          item[second] = value
        }

        if (preItem && preItem.index !== index) {
          parent = preItem
          item[parent.second].value = item[parent.second]
          item[parent.second][second] = value
        } else {
          if (parent) {
            item[parent.second][second] = value
          } else {
            item[second] = value
          }
        }
        preItem = { index, second, value }
        // if (!parent || parent.index !== index) {
        //   parent = preItem
        // }
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
      const result: string[] = []
      const recursionData = (data, i = 0) => {
        let index = i
        for (const k in data) {
          const value = data[k]
          if (typeof value === 'string') {
            result.push(`${index} ${k} ${data[k]}`)
          } else {
            if (k !== 'INDI' && k !== 'FAM') {
              index = k === 'HEAD' || k === 'TRLR' ? 0 : index
              result.push(`${index} ${k}`)
            }
            if (/^@I\d*@$/.test(k)) {
              index = 0
              result.push(`${index} ${k} INDI`)
            }
            if (/^@F\d*@$/.test(k)) {
              index = 0
              result.push(`${index} ${k} FAM`)
            }
            recursionData(data[k], index + 1)
          }
        }
      }
      recursionData(dataCache.get(fileName))
      fs.writeFileSync(`public/${fileName}.ged`, result.join('\n'))
    } else {
      return false
    }
  } catch {
    return false
  }
}
