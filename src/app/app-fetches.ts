import { jsonfetch } from "../lib/lib-fetch"


export async function checkNPMName(name: string) {
  const url = `https://registry.npmjs.org/${ name }`
  const res = await jsonfetch<{
    _id: string
  }>(url)

  if (res.status === "fetch error")
    return "fetch error"

  if (res.status === "parse error")
    return "malformed error"

  if (res.res.status === 404)
    return "available" // OK

  if (!res.res.ok)
    return "unexpected server response"

  const json = res.json
  if (json._id === name)
    return "unavailable"
  else
    return "unexpected response data"
}



export async function searchNPMPackage(name: string) {
  const url = `https://registry.npmjs.com/-/v1/search?text=${ name }&size=10`
  const res = await jsonfetch<{
    objects: {
      downloads: {
        monthly: number,
        weekly: number,
      },
      dependents: number,
      updated: string,
      searchScore: number,
      package: {
        name: string,
        keywords: string[],
        version: string,
        description: string,
        sanitized_name: string,
        publisher: {
          email: string,
          actor: {
            name: string,
            type: string,
            email: string,
          },
          trustedPublisher: {
            oidcConfigId: string,
            id: string,
          },
          username: string,
        },
        maintainers: {
          email: string,
          username: string,
        }[],
        license: string,
        date: string,
        links: {
          npm: string,
          homepage: string,
          repository: string,
          bugs: string,
        }
      },
      score: {
        final: number,
        detail: {
          quality: number,
          popularity: number,
          maintenance: number,
        },
      },
      flags: {
        insecure: number,
      },
    }[],
    total: number,
    time: string,
  }>(url)

  if (res.status === "fetch error")
    return "fetch error"
  if (res.status === "parse error")
    return "malformed error"
  if (!res.res.ok) {
    console.log(res)
    return "unexpected server response"
  }
  return res.json.objects
}