<template>
  <div class="min-w-max m-5 space-y-5">
    <div>
      <label for="email" class="block text-sm font-medium text-gray-700">Current Page</label>
      <div class="mt-1 flex rounded-md shadow-sm">
        <div class="relative flex items-stretch flex-grow focus-within:z-10">
          <input
            v-model="currentPageNumber"
            class="border focus:ring-indigo-500 focus:border-indigo-500 block w-full rounded-none rounded-l-md pl-4 text-base border-gray-300"
            placeholder=""
          >
        </div>
        <button
          type="button"
          class="-ml-px relative inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          @click="resetPage"
        >
          <RefreshIcon class="h-5 w-5 text-gray-400" aria-hidden="true" />
          <span>Reset</span>
        </button>
      </div>
    </div>

    <div class="flex text-gray-500 items-center text-sm">
      Total Pages Scraped:
      <span class="ml-1 text-lg text-gray-800">{{ pagesScraped }}</span>
    </div>

    <div class="flex justify-between gap-5">
      <button
        class="
          flex-1
          inline-flex
          whitespace-nowrap
          border border-transparent
          font-medium
          px-4
          py-2
          text-sm
          leading-5
          rounded-md
          shadow-sm
          text-white
        "
        :class="[
          !isFetching
            ? 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
            : 'bg-indigo-400 hover:bg-indigo-500 focus:ring-indigo-300',
        ]"
        @click="sendAction"
      >
        <PlayIcon v-if="!isFetching" id="resume_icon" class="-ml-1 h-5 w-5 mr-2" />
        <PauseIcon v-else id="pause_icon" class="-ml-1 h-5 w-5 mr-2" />
        <span v-if="!isFetching"> Start Scraping </span>
        <span v-else> Pause Scraping </span>
      </button>

      <button
        id="download_btn"
        class="
          flex-1
          inline-flex
          whitespace-nowrap
          border border-transparent
          font-medium
          px-4
          py-2
          text-sm
          leading-5
          rounded-md
          shadow-sm
          text-white
        "
        :class="[
          !isDownloading
            ? 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500'
            : 'bg-emerald-400 hover:bg-emerald-500 focus:ring-emerald-300',
        ]"
        @click="downloadCSV"
      >
        <DownloadIcon v-if="!isDownloading" class="-ml-1 h-5 w-5 mr-2" />

        <svg
          v-else
          class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        {{ !isDownloading ? "Download" : "Processing..." }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { RefreshIcon, PlayIcon, PauseIcon } from "@heroicons/vue/solid"
import { DownloadIcon } from "@heroicons/vue/outline"
import { sendMessage, onMessage } from "webext-bridge"
import { scrapeStorage, strLastScraped } from "~/logic"

const isFetching = ref(false)
const isDownloading = ref(false)
const currentPageNumber = ref(parseInt(strLastScraped.value) + 1)
const pagesScraped = ref(0)

if (scrapeStorage.value)
  pagesScraped.value = Object.keys(scrapeStorage.value).length

function sendAction() {
  if (!isFetching.value) {
    isFetching.value = true
    send('start')
  }
  else {
    send('stop')
  }
}

function send(action) {
  console.log("action", action)
  chrome.tabs.query({ currentWindow: true, active: true }, async(tabs) => {
    const activeTab = tabs[0].id
    // sendMessage(action, {}, `content-script@${activeTab}`)

    sendMessage(
      action,
      { pageNumber: currentPageNumber.value },
      { context: "content-script", tabId: activeTab },
    )
  })
}

function resetPage() {
  pagesScraped.value = 0
  scrapeStorage.value = {}
  strLastScraped.value = 0
  currentPageNumber.value = 1
}

onMessage("onStop", ({ data }) => {
  console.log('STOPPED')
  isFetching.value = false
})

onMessage("changePage", ({ data }) => {
  console.log("change page", data)

  strLastScraped.value = data.page
  scrapeStorage.value[data.page] = data.data
  currentPageNumber.value = parseInt(data.page) + 1

  if (scrapeStorage.value)
    pagesScraped.value = Object.keys(scrapeStorage.value).length

  send("start")
})

async function downloadCSV() {
  isDownloading.value = true

  if (!scrapeStorage.value) return

  let data = []

  Object.keys(scrapeStorage.value).forEach((key, index) => {
    data = data.concat(scrapeStorage.value[key])
  })

  setTimeout(() => {
    let csvContent = data.map(e => e.join(",")).join("\n")
    csvContent = `data:text/csv;charset=utf-8,${csvContent}`
    const encodedUri = encodeURI(csvContent)
    const downloadLink = document.createElement("a")
    downloadLink.download = `dnb.csv`
    downloadLink.href = encodedUri
    downloadLink.style.display = "none"
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
    isDownloading.value = false
  }, 500)
}
</script>
