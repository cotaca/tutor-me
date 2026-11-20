import type { ReactNode } from 'react'
import { Anchor, List, ScrollArea, Stack, Text, Title } from '@mantine/core'

const OWNER = 'Cedric Kawczynski'

// Adresse nur Base64-kodiert im Bundle und lesbar mit [at]/[punkt] im DOM, damit einfache
// Scraper sie nicht finden. Den mailto-Link gibt es erst beim Klick (wie in ../portfolio).
const EMAIL = 'Y290YWNhQG1haWwub25saW5lLWltcHJlc3N1bS5kZQ=='
const [user, host] = atob(EMAIL).split('@')
const READABLE = `${user} [at] ${host.replace(/\./g, ' [punkt] ')}`

function Email() {
  return (
    <Anchor
      href="#"
      onClick={(e) => {
        e.preventDefault()
        window.location.href = `mailto:${atob(EMAIL)}`
      }}
    >
      {READABLE}
    </Anchor>
  )
}

const GITHUB_PRIVACY =
  'https://docs.github.com/de/site-policy/privacy-policies/github-general-privacy-statement'
const GITHUB_PAGES_DATA =
  'https://docs.github.com/de/pages/getting-started-with-github-pages/about-github-pages#data-collection'

function Section(props: { title: string; children: ReactNode }) {
  return (
    <Stack gap={6}>
      <Title order={4}>{props.title}</Title>
      {props.children}
    </Stack>
  )
}

export function PrivacyView() {
  return (
    <ScrollArea flex={1}>
      <Stack maw={720} gap="lg" pb="xl">
        <Title order={3}>Datenschutz</Title>

        <Section title="Kurzfassung">
          <Text>
            TutorMe läuft vollständig in deinem Browser. Deine Inhalte (Studiengänge, PDFs,
            Karteikarten, Lernstand) werden nur lokal auf deinem Gerät gespeichert und nicht an
            einen Server übertragen. Es gibt keine Cookies, kein Tracking und keine eingebundenen
            Dienste Dritter. Beim Aufruf der Seite verarbeitet allein der Hoster GitHub technisch
            notwendige Verbindungsdaten.
          </Text>
        </Section>

        <Section title="Verantwortlicher">
          <Text>
            {OWNER}
            <br />
            E-Mail: <Email />
          </Text>
        </Section>

        <Section title="Hosting über GitHub Pages">
          <Text>
            Die Seite wird über GitHub Pages bereitgestellt (GitHub, Inc., 88 Colin P. Kelly Jr.
            Street, San Francisco, CA 94107, USA). Beim Aufruf speichert GitHub die IP-Adresse sowie
            weitere technische Angaben (z. B. Zeitpunkt, angefragte Datei, Browser) in Server-Logs,
            um den Dienst sicher und stabil zu betreiben. Ich habe auf diese Logs keinen Zugriff.
          </Text>
          <Text>
            Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Das berechtigte Interesse liegt in einer
            sicheren und zuverlässigen Auslieferung der Seite. Dabei können Daten in die USA
            übermittelt werden. GitHub ist nach dem EU-US Data Privacy Framework zertifiziert (Art.
            45 DSGVO). Details:{' '}
            <Anchor href={GITHUB_PAGES_DATA} target="_blank" rel="noreferrer">
              Datenerfassung bei GitHub Pages
            </Anchor>{' '}
            und{' '}
            <Anchor href={GITHUB_PRIVACY} target="_blank" rel="noreferrer">
              Datenschutzerklärung von GitHub
            </Anchor>
            .
          </Text>
        </Section>

        <Section title="Kontakt per E-Mail">
          <Text>
            Wenn du mir eine E-Mail schreibst, verarbeite ich deine E-Mail-Adresse und den Inhalt
            deiner Nachricht, um die Anfrage zu beantworten (Art. 6 Abs. 1 lit. f DSGVO). E-Mails an
            die oben genannte Adresse laufen über den Dienst Online-Impressum.de der Clear-Media UG,
            Europaring 90, 53757 Sankt Augustin, der sie an mich weiterleitet. Ich lösche die Daten,
            sobald die Anfrage erledigt ist und keine Aufbewahrungspflichten entgegenstehen.
          </Text>
        </Section>

        <Section title="Lokale Speicherung im Browser">
          <Text>
            Alle Inhalte, die du anlegst oder hochlädst, speichert die App in der IndexedDB deines
            Browsers. Diese Daten verlassen dein Gerät nicht, ich kann sie nicht einsehen. Die
            Speicherung ist unbedingt erforderlich, damit die App ihre Funktion erfüllen kann, und
            erfolgt daher ohne Einwilligung (§ 25 Abs. 2 Nr. 2 TDDDG).
          </Text>
          <Text>
            Du kannst die Daten jederzeit löschen, indem du in deinem Browser die Websitedaten für
            diese Seite entfernst. Backups, die du exportierst, liegen als Datei auf deinem Gerät
            und unterliegen allein deiner Kontrolle.
          </Text>
        </Section>

        <Section title="Keine Cookies, kein Tracking">
          <Text>
            Die App setzt keine Cookies, nutzt keine Analyse- oder Werbedienste und lädt keine
            Inhalte von fremden Servern (z. B. Schriftarten oder Skripte aus CDNs).
          </Text>
        </Section>

        <Section title="Deine Rechte">
          <Text>Du hast nach der DSGVO das Recht auf</Text>
          <List>
            <List.Item>Auskunft (Art. 15)</List.Item>
            <List.Item>Berichtigung (Art. 16)</List.Item>
            <List.Item>Löschung (Art. 17)</List.Item>
            <List.Item>Einschränkung der Verarbeitung (Art. 18)</List.Item>
            <List.Item>Widerspruch gegen die Verarbeitung (Art. 21)</List.Item>
            <List.Item>Beschwerde bei einer Datenschutz-Aufsichtsbehörde (Art. 77)</List.Item>
          </List>
          <Text>
            Da ich selbst keine personenbezogenen Daten speichere, betreffen solche Anfragen in der
            Regel die Server-Logs von GitHub. Wende dich dafür gern an mich oder direkt an GitHub.
          </Text>
        </Section>

        <Text size="sm" c="dimmed">
          Stand: November 2026
        </Text>
      </Stack>
    </ScrollArea>
  )
}
