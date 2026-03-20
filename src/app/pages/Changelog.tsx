import { changelog } from "../../../changelog"
import { humanDate } from "../../lib/util-dates"
import { H2 } from "../app-ui"



export function ManagerChangelogPage() {

  return <div className="flex flex-col gap-12 py-4 pb-20">
    {Object.entries(changelog).map(([ ver, value ]) => {
      return <div key={ver}>
        <h2 className="text-xl font-medium text-fg-2 font-mono">{ver}</h2>
        <div className="text-fg-3">{humanDate(value.date)}</div>
        <div className="ml-5 text-fg-2">
          <ul className="list-disc list-inside mt-2 list-outside">
            {value.changes.map((change, i) => <li key={i}>{change}</li>)}
          </ul>
        </div>
      </div>
    })


    }
  </div>
}