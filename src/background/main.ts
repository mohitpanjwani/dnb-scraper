import { sendMessage, onMessage } from "webext-bridge"
// import { Tabs } from "webextension-polyfill"
import {
  scrapeStorageColumns,
  scrapeStorageData,
  strLastScraped,
} from "~/logic"

const isLoading = ref(false)
const isScraping = ref(false)
const currentPageNumber = ref(0)
const lastPageNumber = ref(0)
const status = ref(null) // RUNNING, STOPPED, COMPLETED
const myTabId = ref(null)

// only on dev mode
if (import.meta.hot) {
  // @ts-expect-error for background HMR
  import("/@vite/client")
  // load latest content script
  import("./contentScriptHMR")
}

browser.runtime.onInstalled.addListener((): void => {
  // eslint-disable-next-line no-console
  console.log("Extension installed")
})

/* ************* */
// get count of total scraped page
const getTotalPagesScraped = computed(() => {
  return scrapeStorageData.value
    ? Object.keys(scrapeStorageData.value).length
    : 0
})

// get count of total rows scraped
const getTotalRowsScraped = computed(() => {
  let totalRows = 0
  Object.keys(scrapeStorageData.value).forEach((key) => {
    totalRows += scrapeStorageData.value[key].length
  })
  return totalRows
})

// get last scraped page
const getLastScrapedPageNumber = computed(() => {
  return strLastScraped.value ? strLastScraped.value : 0
})

// set icon
watch(status, () => {
  let path = ""
  switch (status.value) {
    case "RUNNING":
      path = "/assets/running.png"
      break
    case "STOPPED":
      path = "/assets/stopping.png"
      break
    case "COMPLETED":
      path = "/assets/complete.png"
      break
    default:
      path = "/assets/default.png"
  }
  chrome.browserAction.setIcon({ path })
})

// send message to defined context "content-script" | "popup" | "devtools" | "background"
function send(action, context, data = {}) {
  if (myTabId.value)
    sendMessage(action, data, { context, tabId: myTabId.value })
}

// start scraping with send page info
function startScraping() {
  send("startScraping", "content-script", {
    currentPageNumber: parseInt(currentPageNumber.value),
    lastPageNumber: parseInt(lastPageNumber.value),
    totalPagesScraped: parseInt(getTotalPagesScraped.value),
    isScraping: isScraping.value,
  })
}
// update page info into popup
function updatePageInfo() {
  send("setPageInfo", "popup", {
    currentPageNumber: currentPageNumber.value,
    lastPageNumber: lastPageNumber.value,
    isLoading: isLoading.value,
    isScraping: isScraping.value,
    lastScrapedPageNumber: parseInt(getLastScrapedPageNumber.value),
    totalPagesScraped: parseInt(getTotalPagesScraped.value),
    totalRowsScraped: parseInt(getTotalRowsScraped.value),
  })
}

// get page info at the time of open popup
onMessage("init", ({ data }) => {
  isLoading.value = true
  if (!isScraping.value) myTabId.value = data.tabId ? data.tabId : null

  send("getPageInfo", "content-script", { tabId: myTabId.value })
})

// set page info at the time of open popup
onMessage("setInitialState", ({ data }) => {
  isLoading.value = false
  currentPageNumber.value = data.currentPageNumber ? data.currentPageNumber : 1
  lastPageNumber.value = data.lastPageNumber ? data.lastPageNumber : 1

  if (!isScraping.value) myTabId.value = data.tabId ? data.tabId : null
  updatePageInfo()
  if (!isScraping.value) myTabId.value = null
})

// reset scraped data
onMessage("reset", ({ data }) => {
  scrapeStorageColumns.value = {}
  scrapeStorageData.value = {}
  strLastScraped.value = 0
  status.value = ""
  myTabId.value = data.tabId ? data.tabId : null
  send("resetState", "popup", {
    lastScrapedPageNumber: parseInt(getLastScrapedPageNumber.value),
    totalPagesScraped: parseInt(getTotalPagesScraped.value),
    totalRowsScraped: parseInt(getTotalRowsScraped.value),
  })
  myTabId.value = null
})

// start scraping
onMessage("start", ({ data }) => {
  isScraping.value = true
  myTabId.value = data.tabId ? data.tabId : null
  status.value = "RUNNING"
  startScraping()
})

// set scraped data to local storage and goto next page if exists
onMessage("setData", ({ data }) => {
  strLastScraped.value = data.page
  if (data.columns.length) scrapeStorageColumns.value[0] = data.columns

  scrapeStorageData.value[data.page] = data.data

  updatePageInfo()

  setTimeout(() => {
    if (isScraping.value && parseInt(data.lastPage) > parseInt(data.page)) {
      // scraping next page
      send("nextPage", "content-script", { tabId: myTabId.value })
    }
  }, 500)
})

onMessage("startNextPageScraping", () => {
  startScraping()
})

// stop scraping
onMessage("stop", () => {
  isScraping.value = false
  status.value
    = parseInt(lastPageNumber.value) === parseInt(currentPageNumber.value)
      ? "COMPLETED"
      : "STOPPED"

  send("stopScraping", "popup")
  myTabId.value = null
})

// update current page number through goto change number
onMessage("changeGotoPageNumber", ({ data }) => {
  currentPageNumber.value = data.gotoPageNumber ? data.gotoPageNumber : 1
  send("updateCurrentPageNumber", "popup", {
    currentPageNumber: currentPageNumber.value,
  })
})

// get scraped storage data
onMessage("getScrapedStorageData", ({ data }) => {
  myTabId.value = data.tabId ? data.tabId : null

  const scrapeStorage = Object.assign(
    {},
    scrapeStorageColumns.value,
    scrapeStorageData.value,
  )

  send("downloadData", "popup", {
    scrapeStorage,
    totalPagesScraped: parseInt(getTotalPagesScraped.value),
  })
  myTabId.value = null
})
