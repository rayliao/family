import {
  SelectionFamilyRecord,
  SelectionIndividualRecord,
  SelectionIndividualReference,
} from 'read-gedcom'
import dayjs from 'dayjs'
import Gedcom, { FamItem } from './gedcom'

const gedcom = new Gedcom()

export const getFamily = async (famId?: string) => {
  const allFams: FamItem[] = await gedcom.getFam()
  const allKeys: string[] = allFams.map((f) => f.Id)
  const result = {}

  const handleRelations = async (id: string, layer: number, isChild = true) => {
    try {
      const p = await gedcom.getPerson(id)
      if (p) {
        let relas: any = p.Relations
        const onlyOne = typeof relas === 'string'
        relas = onlyOne ? [relas] : relas
        relas = relas.filter((k) => allKeys.indexOf(k) !== -1)
        if (isChild && onlyOne && relas.length === 0) {
          const layerItem = result.hasOwnProperty(layer) ? result[layer] : []
          result[layer] = layerItem.concat(p)
        } else {
          relas.forEach((k) => handleItem(k, layer))
        }
      }
    } catch (error) {
      console.log(error)
    }
  }

  const handleItem = async (fId: string, layer = 100) => {
    try {
      const item = allFams.find((f) => f.Id === fId)
      if (item) {
        const husband = await gedcom.getPerson(item.Husband)
        const wife = await gedcom.getPerson(item.Wife)
        const layerItem = result.hasOwnProperty(layer) ? result[layer] : []
        result[layer] = layerItem.concat({
          ...item,
          Husband: husband,
          Wife: wife,
        })
        const index = allKeys.indexOf(fId)
        if (index !== -1) {
          allKeys.splice(index, 1)
        }
        // 找到孩子自己的信息里面找关系，过滤掉已经处理的，剩下的就是自己的关系，没有就是只有自己
        if (item.Children) {
          if (typeof item.Children === 'string') {
            await handleRelations(item.Children, layer + 1)
          } else {
            item.Children.forEach(
              async (id) => await handleRelations(id, layer + 1),
            )
          }
        }
        // 找到夫妻的信息里面找关系，过滤掉处理的，有关系的话就是其父母的关系
        await handleRelations(item.Husband, layer - 1, false)
        await handleRelations(item.Wife, layer - 1, false)
      }
    } catch (error) {
      console.log(error)
    }
  }
  const entry = famId ? allKeys[famId] : allKeys[0]
  if (entry) {
    handleItem(entry)
  }
  return result
}

const sortFamily = () => {
  if (!gedcom) {
    return null
  }
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
      person.arraySelect().forEach((p) => {
        const famc = p.getChildFamilyLink().value()
        if (isChild && famc.length === 0) {
          const indexItem = sorted.hasOwnProperty(index) ? sorted[index] : []
          sorted[index] = indexItem.concat(handleIndividual(p))
        } else {
          famc.forEach((f) => {
            if (f && allPointers.includes(f)) {
              handleSingle(f, isChild ? index + 1 : index - 1)
            }
          })
        }
      })
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
      const hb = handleIndividual(husband)
      let famc = hb && hb.famc ? [hb.famc] : []
      const wf = handleIndividual(wife)
      if (wf && wf.famc) {
        famc.push(wf.famc)
      }
      sorted[index] = indexItem.concat({
        tag,
        pointer,
        value,
        famc,
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

export const getALlEvents = () => {
  if (!gedcom) {
    return null
  }
  const births: any = []
  const pass: any = []
  // 生日: 还有多少天；重要年龄：1，2，3，10，20，30，40，50，60，70，80，90；结婚: 1, 5, 10, 20, 30, 40
  gedcom
    .getFamilyRecord()
    .arraySelect()
    .forEach((f: SelectionFamilyRecord) => {
      const d: any = f.getEventMarriage().getDate().valueAsDate()[0]
      if (d && d.date && d.date.year) {
        const years = dayjs().diff(d.date.year.value.toString(), 'year')
        // if (years === 1 || years === 5 || (years > 0 && years % 10 === 0)) {
        if (years > 0) {
          const husband = f
            .getHusband()
            .getIndividualRecord()
            .getName()
            .valueNonNull()
          const wife = f
            .getWife()
            .getIndividualRecord()
            .getName()
            .valueNonNull()
          pass.push({
            type: 1,
            husband,
            wife,
            date: d.date.year.value,
            years,
          })
        }
      }
    })
  gedcom
    .getIndividualRecord()
    .arraySelect()
    .forEach((p: SelectionIndividualRecord) => {
      const name = p.getName().valueNonNull()[0]
      const d: any = p.getEventBirth().getDate().valueAsDate()[0]
      if (d && d.date) {
        let age = 0
        if (d.date.year) {
          age = dayjs().diff(d.date.year.value.toString(), 'year')
          if ((age >= 1 && age <= 10) || (age > 0 && age % 10 === 0)) {
            pass.push({
              type: 0,
              name,
              date: d.date.year.value,
              years: age,
            })
          }
        }
        if (d.date.month && d.date.day) {
          const birth = `${d.date.month}-${d.date.day}`
          const days = dayjs(birth).diff(dayjs().format('MM-DD'), 'day')
          if (days >= 0) {
            births.push({
              name,
              birth,
              days,
              age,
            })
          }
        }
      }
    })
  return {
    births: births
      .filter((b) => b.days <= 30)
      .sort((a, b) => (a.days > b.days ? -1 : 1)),
    pass: pass
      .filter((p) => p.years <= 400)
      .sort((a, b) => (a.years > b.years ? 1 : -1)),
  }
}

export const getPerson = async (pointer: string) => {
  getALlEvents()
  return ''
}
