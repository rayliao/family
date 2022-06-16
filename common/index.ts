import {
  readGedcom,
  SelectionFamilyRecord,
  SelectionGedcom,
  SelectionIndividualRecord,
  SelectionIndividualReference,
  TreeNode,
} from 'read-gedcom'
import { server } from './config'

const promise = fetch(`${server}/royal92.ged`)
  .then((r) => r.arrayBuffer())
  .then(readGedcom)

export const getFamilyTree = () => promise.then((gedcom) => sortFamily(gedcom))

const sortFamily = (gedcom: SelectionGedcom) => {
  const allFams = gedcom.getFamilyRecord()
  const allPointers = allFams.pointer()
  const sorted = {}
  if (allPointers.length) {
    const handleChildFamily = (
      indi: SelectionIndividualReference,
      index,
      isChild = false,
    ) => {
      const person = indi.getIndividualRecord()
      // const { tag, value } = person.array()[0]
      const famc = person.getChildFamilyLink().value()
      if (isChild && famc.length === 0) {
        console.log('person', person.array())
        // const indexItem = sorted.hasOwnProperty(index) ? sorted[index] : []
        // sorted[index] = indexItem.concat(fam.array()[0])
      } else {
        // 这里还需要区分是否是子女
        famc.forEach((f) => {
          if (f && allPointers.includes(f)) {
            handleSingle(f, isChild ? index + 1 : index - 1)
          }
        })
      }
    }

    const handleIndividual = (indi: SelectionIndividualReference) => {
      const person = indi.getIndividualRecord().array()
      if (person.length) {
        const { tag, pointer, value, children } = person[0]
        let name = ''
        let famc = ''
        children.forEach((c) => {
          if (c.tag === 'NAME') {
            name = c.value || ''
          }
          if (c.tag === 'FAMC') {
            famc = c.value || ''
          }
        })
        return {
          tag,
          pointer,
          value,
          name,
          famc,
        }
      } else {
        return ''
      }
    }

    const handleSingle = (p: string, index = 100) => {
      const fam = gedcom.getFamilyRecord(p)
      const husband = fam.getHusband()
      const wife = fam.getWife()
      const { tag, pointer, value } = fam.array()[0]
      const indexItem = sorted.hasOwnProperty(index) ? sorted[index] : []
      sorted[index] = indexItem.concat({
        tag,
        pointer,
        value,
        husband: handleIndividual(husband),
        wife: handleIndividual(wife),
      })
      const pIndex = allPointers.indexOf(p)
      if (pIndex !== -1) {
        allPointers.splice(pIndex, 1)
      }
      handleChildFamily(fam.getChild(), index, true)
      handleChildFamily(husband, index)
      handleChildFamily(wife, index)
    }
    const entry = allPointers[0]
    if (entry) {
      handleSingle(entry)
    }
  }
  return sorted
}

// Convert the javascript object containing family data into GEDCOM format
const convertFamilyTree = (familyTree: any) => {
  // var dataTree = this.data.slice(0)
  // // Recursively loop over each item and add to data array
  // var dataArray = []
  // dataTree.forEach(function flatten(item) {
  //   // Preprocess value for inserting CONC and CONT tags
  //   var values = []
  //   if (item.value) {
  //     values = item.value.match(/(\n|.{1,200})/g)
  //   }
  //   // Add data
  //   dataArray.push(
  //     `${item.level}${item.pointer ? ' ' + item.pointer : ''}${
  //       item.tag ? ' ' + item.tag : ''
  //     }${values.length > 0 ? ' ' + values[0] : ''}`,
  //   )
  //   // Add extra data in CONT or CONC
  //   while (values.length > 1) {
  //     values.shift()
  //     if (values[0].includes('\n')) {
  //       dataArray.push(`${item.level + 1} CONT ${values[1]}`)
  //       values.shift()
  //     } else {
  //       dataArray.push(`${item.level + 1} CONC ${values[0]}`)
  //     }
  //   }
  //   // Children
  //   if (item.items) {
  //     item.items.forEach(flatten)
  //   }
  //   return item
  // })
  // // Return data array as string
  // return dataArray.join('\n')
}

// save data to gedcom file
const saveFile = () => {
  // const data = convertFamilyTree(getFamilyTree())
  // const blob = new Blob([data], { type: 'text/plain;charset=utf-8' })
  // const link = document.createElement('a')
  // link.href = URL.createObjectURL(blob)
  // link.download = 'royal92.ged'
  // link.click()
}
