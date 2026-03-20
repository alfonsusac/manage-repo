import { cn } from "lazy-cn"
import { matchRoute } from "../lib/react-route"
import { useQuery } from "../lib/react-store"

export function RoutePage(props: {
  children: React.ReactNode,
  path: `/${ string }`,
  className?: string,
  classNames?: {
    all?: string,
    shown?: string,
    hidden?: string,
  }
}) {
  const router = useRouter()
  const isCurrentPath = matchRoute(router.current || "", props.path)
  const isNavingBackwardOut = router.meta.direction === "backward" && !isCurrentPath
  const isNavingBackwardIn = router.meta.direction === "backward" && isCurrentPath
  const isNavingForwardOut = router.meta.direction === "forward" && !isCurrentPath
  const isNavingForwardIn = router.meta.direction === "forward" && isCurrentPath
  return <div
    className={cn(
      "max-sm:transition-discrete transition-all absolute inset-0 ",
      "overflow-x-hidden overflow-y-visible",
      "sm:overflow-visible",
      "duration-300 starting:opacity-0",
      "sm:relative",
      props.className,
      props.classNames?.all,
      isCurrentPath ? "" : "pointer-events-none",
      isCurrentPath
        ? props.classNames?.shown
        : [ props.classNames?.hidden, "hidden" ],
      isNavingBackwardOut && "max-sm:translate-x-full",
      isNavingBackwardIn && "max-sm:translate-x-0 opacity-100 max-sm:starting:-translate-x-20",
      isNavingForwardOut && "max-sm:-translate-x-20 max-sm:opacity-0",
      isNavingForwardIn && "max-sm:translate-x-0 opacity-100 max-sm:starting:translate-x-full",
    )}
    data-current={isCurrentPath ? "" : undefined}
  >
    <div className="flex flex-col p-4 bg-bg min-h-screen pb-40">
      {props.children}
    </div>
  </div>
}



export function useRouter() {
  const [ router, updateRouter ] = useQuery("app_router", (clean) => {
    const handlePopState = () => {
      // what about forward navigation? we can detect it by comparing the new path with the last path in history
      updateRouter({
        current: window.location.pathname + window.location.search,
        history: router.history.slice(0, -1),
        interruptors: router.interruptors,
        meta: {
          direction: null,
        },
      })
    }
    // what about interrupting navigation? we can add a set of interruptors that can be called before navigating away from the current page, and if any of them returns true, we can prevent navigation
    window.addEventListener("popstate", handlePopState)
    clean(() => window.removeEventListener("popstate", handlePopState))

    return {
      current: window.location.pathname + window.location.search,
      // current: "/",
      history: [] as string[],
      interruptors: new Set<() => void>,
      meta: {
        direction: null as "forward" | "backward" | null,
      },
    }
  })

  function navigate(path: string, direction: "forward" | "backward" | null) {
    if (router.interruptors.size > 0) {
      router.interruptors.forEach(cb => cb())
      return
    }
    window.history.pushState(null, "", path)
    updateRouter({
      current: path,
      history: [ ...router.history, router.current ],
      interruptors: router.interruptors,
      meta: {
        direction,
      },
    })
  }

  function addInterruption(cb: () => void) {
    router.interruptors.add(cb)
    updateRouter(router)
    return () => {
      router.interruptors.delete(cb)
      updateRouter(router)
    }
  }

  return {
    ...router,
    pathname: router.current.split('?')[ 0 ],
    query: Object.fromEntries(new URLSearchParams(router.current.split('?')[ 1 ] || "")),
    navigate,
    addInterruption,
  }
}