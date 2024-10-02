import * as React from 'react'
import { Change, Dispatch } from 'raj-ts'

type Model = {
  moreSelected: boolean
  editableNumberOfDonations: number | undefined
  submittedNumberOfDonations: number | undefined
}

type Msg =
  | {
      type: 'update_donation_count'
      count: number | undefined
      submit: boolean
    }
  | { type: 'submit_donation_count' }
  | { type: 'select_more' }

const url = new URL(window.location.href)
const d = url.searchParams.get('donations') ?? undefined
const dInt = d ? parseInt(d, 10) : undefined
const dGoodInt = Number.isInteger(dInt) ? dInt : undefined
const submittedNumberOfDonations = dGoodInt

const init: Change<Msg, Model> = [
  {
    moreSelected: false,
    editableNumberOfDonations: undefined,
    submittedNumberOfDonations,
  },
  () => {
    updatePageInfo({
      title: 'Bloodie',
      description: 'Donate blood',
    })
  },
]

type DocumentHeadInfo = { title: string; description: string }

function updatePageInfo(content: DocumentHeadInfo) {
  const { title, description } = content
  document.title = title

  const metaUpdates = [
    ['description', description],
    ['og:title', title],
    ['twitter:title', title],
    ['twitter:description', description],
    [],
  ] as [string, string][]

  for (const [name, value] of metaUpdates) {
    document
      .querySelector(`meta[name="${name}"]`)
      ?.setAttribute('content', value)

    document
      .querySelector(`meta[property="${name}"]`)
      ?.setAttribute('content', value)
  }
}

function update(msg: Msg, model: Model): Change<Msg, Model> {
  switch (msg.type) {
    case 'select_more': {
      return [{ ...model, moreSelected: true }]
    }
    case 'update_donation_count': {
      const newModel = { ...model, editableNumberOfDonations: msg.count }
      if (!msg.submit) {
        return [newModel]
      }

      return [
        {
          ...newModel,
          submittedNumberOfDonations: model.editableNumberOfDonations,
        },
        () => {
          window.location.search = `donations=${model.editableNumberOfDonations}`
        },
      ]
    }
    case 'submit_donation_count': {
      return [
        {
          ...model,
          submittedNumberOfDonations: model.editableNumberOfDonations,
        },
        () => {
          window.location.search = `donations=${model.editableNumberOfDonations}`
        },
      ]
    }

    default:
      return [model]
  }
}

function AppWrap({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="start">
      <h1>
        <a href={window.location.href.split('?')[0]}>Bloodie</a>
      </h1>
      <p>Donate blood</p>
      {children}
    </div>
  )
}

function imperialPintToBestUnit(
  submittedNumberOfDonations: number
): React.ReactNode {
  if (submittedNumberOfDonations >= 8) {
    if (submittedNumberOfDonations === 8) {
      return '1 gallon'
    }
    return `${atMostTwoDecimalPlaces(submittedNumberOfDonations / 8)} gallons`
  }

  if (submittedNumberOfDonations >= 2) {
    if (submittedNumberOfDonations === 2) {
      return '1 quart'
    }
    return `${atMostTwoDecimalPlaces(submittedNumberOfDonations / 2)} quarts`
  }

  if (submittedNumberOfDonations === 1) {
    return '1 pint'
  }

  return `${submittedNumberOfDonations} pints`
}

function metricMlToBestUnit(ml: number): React.ReactNode {
  if (ml < 1000) {
    return `${ml} milliliters`
  }

  return `${atMostTwoDecimalPlaces(ml / 1000)} liters`
}

function quickPlural(amount: number, singularUnit: string) {
  if (amount === 1) {
    return `${atMostTwoDecimalPlaces(amount)} ${singularUnit}`
  }
  return `${atMostTwoDecimalPlaces(amount)} ${singularUnit}s`
}

function atMostTwoDecimalPlaces(i: number) {
  if (Number.isInteger(i)) {
    return `${i}`
  }
  return i.toFixed(2)
}

function view(model: Model, dispatch: Dispatch<Msg>) {
  ;(window as any).$model = model

  if (typeof model.submittedNumberOfDonations === 'number') {
    return (
      <AppWrap>
        <div className="stats">
          <h2 {...{ style: { color: 'red' } }}>
            You have donated {model.submittedNumberOfDonations}{' '}
            {model.submittedNumberOfDonations === 1 ? 'time' : 'times'} in your
            life.
          </h2>

          <p>
            An average donation is about one pint or 500 milliliters. You have
            donated in total{' '}
            <b>{imperialPintToBestUnit(model.submittedNumberOfDonations)}</b> or{' '}
            <b>{metricMlToBestUnit(model.submittedNumberOfDonations * 500)}</b>{' '}
            of blood.
          </p>

          <p>
            An average adult has 1.35 gallons of blood. You've donated{' '}
            <b>
              {quickPlural(
                (model.submittedNumberOfDonations * 500) / 5110.306,
                'human'
              )}{' '}
              worth
            </b>{' '}
            of blood.
          </p>

          <p>
            An average blood transfusion takes 3 units. Your donations amount to{' '}
            <b>
              {atMostTwoDecimalPlaces(model.submittedNumberOfDonations / 3)}
            </b>{' '}
            blood{' '}
            {model.submittedNumberOfDonations === 3
              ? 'transfusion'
              : 'transfusions'}
            .
          </p>
        </div>
      </AppWrap>
    )
  }

  return (
    <AppWrap>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          dispatch({ type: 'submit_donation_count' })
        }}
      >
        {model.moreSelected ? (
          <>
            <label>You god damn legend, how many times?</label>

            <div>
              <input
                type="text"
                inputMode="numeric"
                value={
                  model.editableNumberOfDonations === undefined
                    ? ''
                    : model.editableNumberOfDonations
                }
                autoFocus
                onInput={(e) => {
                  const textValue = (e.target as HTMLInputElement).value
                  if (textValue === '') {
                    dispatch({
                      type: 'update_donation_count',
                      count: undefined,
                      submit: false,
                    })
                  }

                  const count = parseInt(textValue, 10)
                  if (Number.isInteger(count)) {
                    dispatch({
                      type: 'update_donation_count',
                      count,
                      submit: false,
                    })
                  }
                }}
              />
              <button type="submit">Confirm</button>
            </div>
          </>
        ) : (
          <>
            <label>How many times have you donated blood in your life?</label>

            <div>
              {[0, 1, 2, 3, 4, 5].map((i) => {
                return (
                  <button
                    key={i}
                    onClick={() =>
                      dispatch({
                        type: 'update_donation_count',
                        count: i,
                        submit: true,
                      })
                    }
                  >
                    {i}
                  </button>
                )
              })}
              <button
                key="more"
                onClick={() => dispatch({ type: 'select_more' })}
              >
                More…
              </button>
            </div>
          </>
        )}
      </form>
    </AppWrap>
  )
}

export const appProgram = {
  init,
  update,
  view,
}
