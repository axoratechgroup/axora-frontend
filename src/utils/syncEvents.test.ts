import { describe, it, expect, vi } from 'vitest'
import { notifyWalletUpdate, subscribeWalletUpdate } from './syncEvents.ts'

describe('syncEvents', () => {
  it('triggers listener when notifyWalletUpdate is called', () => {
    const callback = vi.fn()
    const unsubscribe = subscribeWalletUpdate(callback)

    notifyWalletUpdate()

    expect(callback).toHaveBeenCalledTimes(1)
    unsubscribe()

    notifyWalletUpdate()
    expect(callback).toHaveBeenCalledTimes(1)
  })
})
