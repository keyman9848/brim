/* @flow */

import type {NoticeAction, NoticeState} from "./types"

let init: NoticeState = {error: null, visible: false}

export default function reducer(
  state: NoticeState = init,
  action: NoticeAction
) {
  switch (action.type) {
    case "NOTICE_SET":
      return {...state, error: action.error, visible: true}
    case "NOTICE_CLEAR":
      return {...state, error: null}
    case "NOTICE_DISMISS":
      return {...state, visible: false}
    default:
      return state
  }
}
