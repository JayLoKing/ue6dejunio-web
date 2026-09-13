/**
 * Hands a generated file to the browser.
 *
 * <p>Shared by every document the school downloads, because the awkward part is the same for all of
 * them and a copy of this is a copy that misses the next fix.
 *
 * <p>The anchor goes into the document and the object URL is released on the next tick. Clicking a
 * detached anchor and revoking its URL in the same statement raced the download in some browsers,
 * which read the blob after the click returns.
 */
export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.style.display = "none"
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
