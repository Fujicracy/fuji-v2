import { chains } from "../store/auth.slice"

const chainsMap = new Map()
chains.map((c) => {
  chainsMap.set(c.id, c.label) // string hex id
  chainsMap.set(parseInt(c.id), c.label) // num id
})

export function chainName(id?: string | number) {
  const name = chainsMap.get(id)
  if (!name) {
    throw `No chain found with id ${id}. "id" must either:
    - be a string with hex value,
    - a number with decimal value`
  }
  return name
}
