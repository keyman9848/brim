/* @flow */

import type {Thunk} from "redux-thunk"

import {chooseSpace} from "../../space/choose"
import {fetchSpaces, toPromise} from "../../backend/fetch"
import {getCurrentSpaceName} from "../reducers/spaces"
import {setSpaceNames} from "../actions"
import {switchSpace} from "../../space/switch"

export const initSearchPage = (): Thunk => (dispatch, getState) => {
  return toPromise(dispatch(fetchSpaces())).then((names) => {
    dispatch(setSpaceNames(names))

    if (names.length == 0) {
      return Promise.reject("NoSpaces")
    } else {
      let saved = getCurrentSpaceName(getState())
      return dispatch(switchSpace(chooseSpace(names, saved)))
    }
  })
}
