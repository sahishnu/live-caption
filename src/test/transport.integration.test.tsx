import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Console } from '../routes/Console'
import { DisplayView } from '../routes/DisplayView'
import { sessionReducer, createInitialState } from '../session/reducer'
import { selectActiveCues } from '../session/selectors'
import { createInMemoryTransport } from '../transport/inMemoryTransport'
import { createLocalTransport } from '../transport/localTransport'

function loadNamedScript(
  state: ReturnType<typeof createInitialState>,
  text: string,
  name: string,
) {
  let next = sessionReducer(state, { type: 'import/pasted', text, format: 'dialogue' })
  return sessionReducer(next, { type: 'import/confirmed', name })
}

describe('Console and Display View over a Transport', () => {
  it('pressing Enter in the caption field takes the line', async () => {
    const transport = createInMemoryTransport()
    const user = userEvent.setup()

    render(
      <>
        <Console transport={transport} />
        <DisplayView transport={transport} />
      </>,
    )

    await user.type(screen.getByLabelText('Caption text'), 'Taken on Enter.{Enter}')

    const display = await screen.findByLabelText('Display View')
    expect(within(display).getByText('Taken on Enter.')).toBeInTheDocument()
  })

  it('taking a line in the Console renders it on the Display View', async () => {
    const transport = createInMemoryTransport()
    const user = userEvent.setup()

    render(
      <>
        <Console transport={transport} />
        <DisplayView transport={transport} />
      </>,
    )

    await user.type(screen.getByLabelText('Caption text'), 'The lights come up.')
    await user.click(screen.getByRole('button', { name: 'Take' }))

    const display = await screen.findByLabelText('Display View')
    expect(within(display).getByText('The lights come up.')).toBeInTheDocument()
  })

  it('restores on-air content when the Display View remounts', async () => {
    const transport = createInMemoryTransport()
    const user = userEvent.setup()

    render(<Console transport={transport} />)
    await user.type(screen.getByLabelText('Caption text'), 'Scene two begins.')
    await user.click(screen.getByRole('button', { name: 'Take' }))

    const { unmount } = render(<DisplayView transport={transport} />)
    const display = await screen.findByLabelText('Display View')
    expect(within(display).getByText('Scene two begins.')).toBeInTheDocument()
    unmount()

    render(<DisplayView transport={transport} />)
    const restored = await screen.findByLabelText('Display View')
    expect(within(restored).getByText('Scene two begins.')).toBeInTheDocument()
  })

  it('persists Style Config across remounting the Console', async () => {
    const transport = createInMemoryTransport()
    const user = userEvent.setup()

    const { unmount } = render(<Console transport={transport} />)
    await user.click(screen.getByRole('tab', { name: 'Setup' }))
    fireEvent.change(screen.getByLabelText('Font size (px)'), { target: { value: '80' } })
    unmount()

    render(<Console transport={transport} />)
    await user.click(screen.getByRole('tab', { name: 'Setup' }))
    expect(screen.getByLabelText('Font size (px)')).toHaveValue(80)
  })

  it('syncs calibration mode to the Display View', async () => {
    const transport = createInMemoryTransport()
    const user = userEvent.setup()

    render(
      <>
        <Console transport={transport} />
        <DisplayView transport={transport} />
      </>,
    )

    await user.click(screen.getByRole('tab', { name: 'Setup' }))
    await user.click(screen.getByRole('button', { name: 'Calibration Mode' }))

    const display = await screen.findByLabelText('Display View')
    await waitFor(() => {
      expect(within(display).getAllByText((text) => /^W{10,}$/.test(text))).toHaveLength(2)
    })
  })

  it('syncs calibration mode across separate Transport instances like two browser windows', async () => {
    const consoleTransport = createLocalTransport()
    const displayTransport = createLocalTransport()
    const user = userEvent.setup()

    render(<Console transport={consoleTransport} />)
    render(<DisplayView transport={displayTransport} />)

    await user.click(screen.getByRole('tab', { name: 'Setup' }))
    await user.click(screen.getByRole('button', { name: 'Calibration Mode' }))

    const display = await screen.findByLabelText('Display View')
    await waitFor(() => {
      expect(within(display).getAllByText((text) => /^W{10,}$/.test(text))).toHaveLength(2)
    })
  })

  it('shows calibration on Display when it opens after Console enabled it', async () => {
    const consoleTransport = createLocalTransport()
    const displayTransport = createLocalTransport()
    const user = userEvent.setup()

    render(<Console transport={consoleTransport} />)
    await user.click(screen.getByRole('tab', { name: 'Setup' }))
    await user.click(screen.getByRole('button', { name: 'Calibration Mode' }))

    render(<DisplayView transport={displayTransport} />)
    const display = await screen.findByLabelText('Display View')
    await waitFor(() => {
      expect(within(display).getAllByText((text) => /^W{10,}$/.test(text))).toHaveLength(2)
    })
  })

  it('switches the active script from the Show tab', async () => {
    const transport = createInMemoryTransport()
    let state = loadNamedScript(createInitialState(), 'ANN: Drama line.', 'Drama')
    state = loadNamedScript(state, 'BOB: Address line.', 'Address')
    transport.publish('session', state)

    const user = userEvent.setup()
    render(<Console transport={transport} />)
    await user.click(screen.getByRole('tab', { name: 'Show' }))

    const scriptSelect = screen.getByLabelText('Active script')
    expect(scriptSelect).toHaveValue(state.activeScriptId)
    expect(selectActiveCues(state)[0]?.text).toBe('Address line.')

    const dramaId = state.scriptLibrary.find((script) => script.name === 'Drama')!.id
    await user.selectOptions(scriptSelect, dramaId)

    expect(scriptSelect).toHaveValue(dramaId)
    const showPanel = document.getElementById('console-panel-show')!
    expect(showPanel).toHaveTextContent('Drama line.')
    expect(showPanel).not.toHaveTextContent('Address line.')
  })
})
