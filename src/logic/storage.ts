import { useStorageLocal } from '~/composables/useStorageLocal'

export const scrapeStorage = useStorageLocal('scrapeData', {}, { listenToStorageChanges: true })
export const strLastScraped = useStorageLocal('strLastScraped', 0, { listenToStorageChanges: true })
