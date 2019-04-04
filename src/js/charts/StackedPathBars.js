/* @flow */

import * as d3 from "d3"
import type {ChartElement} from "../models/Chart"
import Chart from "../models/Chart"
import * as Time from "../lib/Time"
import {dataAttrs} from "../test/integration"

export default class StackedPathBars implements ChartElement {
  dispatch: Function

  constructor(dispatch: Function) {
    this.dispatch = dispatch
  }

  mount(chart: Chart) {
    d3.select(chart.svg)
      .append("g")
      .attr("class", "chart")
      .attr(dataAttrs.histogram.attr, dataAttrs.histogram.value)
      .attr(
        "transform",
        `translate(${chart.margins.left}, ${chart.margins.top})`
      )
  }

  draw(chart: Chart) {
    const series = d3.stack().keys(chart.data.keys)(chart.data.data)
    const barGroups = d3
      .select(chart.svg)
      .select(".chart")
      .selectAll("g")
      .data(series, d => d.key)

    const t = d3.transition().duration(100)

    barGroups
      .exit()
      .selectAll("rect")
      .remove()

    const bars = barGroups
      .enter()
      .append("g")
      .attr("class", d => `${d.key}-bg-color`)
      .merge(barGroups)
      .selectAll("rect")
      .data(d => d)

    bars
      .exit()
      .attr("opacity", 1)
      .attr("y", chart.dimens.innerHeight)
      .attr("opacity", 0)
      .remove()

    let width = 0
    if (chart.data.data[0]) {
      const ts = chart.data.data[0].ts
      const {number, unit} = chart.data.interval
      const a = chart.scales.timeScale(ts)
      const b = chart.scales.timeScale(Time.add(ts, number, unit))
      width = Math.max(Math.floor(b - a) - 2, 2)
    }

    bars
      .enter()
      .append("rect")
      .attr("y", chart.dimens.innerHeight)
      .attr("height", 0)
      .merge(bars)
      .attr("width", width)
      .attr("x", d => chart.scales.timeScale(d.data.ts))
      .transition(t)
      .attr("y", d => chart.scales.yScale(d[1]))
      .attr(
        "height",
        d => chart.scales.yScale(d[0]) - chart.scales.yScale(d[1])
      )
  }
}
