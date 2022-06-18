import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { getALlEvents, getFamilyTree } from '../common'
import { Fragment, useState } from 'react'
import { Button, Modal } from 'react-daisyui'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime)

export const getServerSideProps = async () => {
  const data = await getFamilyTree()
  const events = await getALlEvents()
  return {
    props: {
      data: JSON.stringify(data),
      events,
    },
  }
}

const Home: NextPage<{ data: any; events: { births: any; pass: any } }> = ({
  data,
  events,
}) => {
  const result = JSON.parse(data)
  const [visibleEvent, setVisibleEvent] = useState<boolean>(false)
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex w-full flex-1 flex-col items-center justify-center px-20 text-center">
        <div className="flex justify-center space-x-4 mb-8 py-5 fixed bg-blue-200 w-full top-0">
          <Button
            size="sm"
            color="primary"
            onClick={() => setVisibleEvent(true)}>
            事件
          </Button>
          <Button size="sm" color="secondary" variant="outline">
            统计
          </Button>
        </div>
        {Object.keys(result).map((k) => {
          let currentFamc = ''
          let current = -1
          const bgColors = [
            'bg-stone-100',
            'bg-red-100',
            'bg-orange-100',
            'bg-amber-100',
            'bg-lime-100',
            'bg-green-100',
            'bg-teal-100',
            'bg-cyan-100',
            'bg-sky-100',
            'bg-violet-100',
          ]
          return (
            <Fragment key={k}>
              <div className="flex flex-row space-x-2">
                {result[k].map((f, index) => {
                  if (!f.famc.includes(currentFamc)) {
                    current += 1
                    currentFamc = f.famc
                  }
                  return (
                    <div
                      className={`border-2 back border-lime-100 border-solid p-2 rounded ${bgColors[current]}`}
                      key={index}>
                      {f.husband && <span>{f.husband.name}</span>}
                      {f.husband && f.wife && <span>&nbsp;❤️&nbsp;</span>}
                      {f.wife && <span>{f.husband.name}</span>}
                    </div>
                  )
                })}
              </div>
              <div className="divider" />
            </Fragment>
          )
        })}
      </main>
      <Modal open={visibleEvent} onClickBackdrop={() => setVisibleEvent(false)}>
        <Modal.Header>事件</Modal.Header>

        <Modal.Body>
          {events.births.map((b, index) => (
            <p key={index}>
              {b.days === 0
                ? `🎉${b.name}今天生日`
                : `🍰离${b.name}生日还有${b.days}天`}
            </p>
          ))}
          <div>...</div>
          {events.pass.map((p, index) => (
            <p key={index}>
              {p.type === 0
                ? `✌️${p.name}${p.years}岁啦`
                : `🎎${p.husband}和${p.wife}结婚${p.years}年啦`}
            </p>
          ))}
        </Modal.Body>

        <Modal.Actions>
          <Button onClick={() => setVisibleEvent(false)} color="primary">
            Accept
          </Button>
          <Button onClick={() => setVisibleEvent(false)}>Cancel</Button>
        </Modal.Actions>
      </Modal>
      <footer className="flex h-24 w-full items-center justify-center border-t">
        <a
          className="flex items-center justify-center gap-2"
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer">
          Powered by{' '}
          <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
        </a>
      </footer>
    </div>
  )
}

export default Home
