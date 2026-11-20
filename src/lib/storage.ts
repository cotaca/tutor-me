// Ohne diese Freigabe darf der Browser die IndexedDB bei Speicherknappheit ohne Rückfrage leeren.
// Chrome entscheidet still, Firefox fragt nach, deshalb erst aufrufen, wenn echte Daten anfallen.
export async function requestPersist() {
  if (!navigator.storage?.persist || (await navigator.storage.persisted())) return
  await navigator.storage.persist()
}
