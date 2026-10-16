export type DocHeading = { id: string; text: string; level: 2 | 3 }

export type RenderedStarterDoc = {
  html: string
  headings: DocHeading[]
}
