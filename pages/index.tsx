import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { getFamilyTree } from '../common'
import { Fragment } from 'react'

export const getServerSideProps = async () => {
  const data = await getFamilyTree()
  return {
    props: {
      data: JSON.stringify(data),
    },
  }
}

const Home: NextPage<{ data: any }> = ({ data }) => {
  const result = JSON.parse(data)
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex w-full flex-1 flex-col items-center justify-center px-20 text-center">
        <h1 className="text-6xl font-bold mb-4">
          Welcome to{' '}
          <a className="text-blue-600" href="https://nextjs.org">
            Next.js!
          </a>
        </h1>
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
                  console.log(f.famc)
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
