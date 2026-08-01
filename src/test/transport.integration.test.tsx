import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Console } from '../routes/Console'
import { DisplayView } from '../routes/DisplayView'
import { createInMemoryTransport } from '../transport/inMemoryTransport'

describe('Console and Display View over a Transport', () => {
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

    expect(await screen.findByText('The lights come up.')).toBeInTheDocument()
  })

  it('restores on-air content when the Display View remounts', async () => {
    const transport = createInMemoryTransport()
    const user = userEvent.setup()

    render(<Console transport={transport} />)
    await user.type(screen.getByLabelText('Caption text'), 'Scene two begins.')
    await user.click(screen.getByRole('button', { name: 'Take' }))

    const { unmount } = render(<DisplayView transport={transport} />)
    expect(await screen.findByText('Scene two begins.')).toBeInTheDocument()
    unmount()

    render(<DisplayView transport={transport} />)
    expect(await screen.findByText('Scene two begins.')).toBeInTheDocument()
  })
})
