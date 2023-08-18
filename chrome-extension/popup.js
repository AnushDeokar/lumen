/* eslint-env webextensions */

const ENDPOINT = "https://app.uselumen.com"

const iframe = document.querySelector("iframe")

const date = getDateString()

const tab = await getActiveTab()

const contentType = getContentType(tab)

const body = getNoteBody({ tab, contentType, date })

// Change src of iframe
iframe.src = `${ENDPOINT}/new?body=${encodeURIComponent(body)}`

async function getActiveTab() {
  const options = { active: true, lastFocusedWindow: true }
  const [tab] = await chrome.tabs.query(options)
  return tab
}

/** Get current date in ISO format */
function getDateString() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * @typedef {('default'|'github-repo'|'gist')} ContentType
 */

// TODO: book, video, article, tweet
/**
 * Determine content type of a tab
 * @param {chrome.tabs.Tab} tab
 * @returns {ContentType}
 */
function getContentType(tab) {
  const gistRegex = /^https:\/\/gist\.github\.com\/[^/]+\/[^/]+/
  if (gistRegex.test(tab.url)) {
    return "gist"
  }

  const githubRepoRegex = /^https:\/\/github\.com\/[^/]+\/[^/]+/
  if (githubRepoRegex.test(tab.url)) {
    return "github-repo"
  }

  return "default"
}

/**
 * @param {object} options
 * @param {chrome.tabs.Tab} options.tab
 * @param {ContentType} options.contentType
 * @param {string} options.date
 * @returns {string}
 */
function getNoteBody({ tab, contentType, date }) {
  switch (contentType) {
    case "gist": {
      const title = tab.title.replace(/ · GitHub$/, "")
      const ownerUrl = tab.url.replace(/\/[^/]+$/, "")
      return `---
owner: ${ownerUrl}
date_saved: ${date}
tags: [bookmark, ${contentType}]
---

# [${title}](${tab.url})
`
    }

    case "github-repo": {
      const [owner, repo] = tab.url.split("/").slice(-2)
      const ownerUrl = tab.url.replace(/\/[^/]+$/, "")
      const description = tab.title.split(": ")[1] || ""
      return `---
owner: ${ownerUrl}
date_saved: ${date}
tags: [bookmark, ${contentType}]
---

# [${owner}/${repo}](${tab.url})

${description}
`
    }

    default: {
      return `---
date_saved: ${date}
tags: [bookmark]
---

# [${tab.title}](${tab.url})
`
    }
  }
}
