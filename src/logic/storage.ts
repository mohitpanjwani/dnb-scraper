import { useStorageLocal } from '~/composables/useStorageLocal'

export const scrapeStorageColumns = useStorageLocal('scrapeColumns', {}, { listenToStorageChanges: true })
export const scrapeStorageData = useStorageLocal('scrapeData', {}, { listenToStorageChanges: true })
export const strLastScraped = useStorageLocal('strLastScraped', 0, { listenToStorageChanges: true })
