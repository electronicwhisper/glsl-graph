R.create "GridView",
  propTypes:
    center: Array
    pixelSize: Number

  render: ->
    R.canvas {}

  componentDidMount: ->
    @_draw()

  componentDidUpdate: ->
    @_draw()

  shouldComponentUpdate: (nextProps) ->
    !_.isEqual(@props, nextProps)

  _draw: ->
    canvas = @getDOMNode()

    # Size it
    rect = canvas.getBoundingClientRect()
    if canvas.width != rect.width or canvas.height != rect.height
      canvas.width = rect.width
      canvas.height = rect.height

    ctx = canvas.getContext("2d")
    clear(ctx)
    drawGrid(ctx, @center, @pixelSize)


# =============================================================================
# Canvas Helpers
# =============================================================================

clear = (ctx) ->
  canvas = ctx.canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

canvasBounds = (ctx) ->
  canvas = ctx.canvas
  {
    cxMin: 0
    cxMax: canvas.width
    cyMin: canvas.height
    cyMax: 0
    width: canvas.width
    height: canvas.height
  }

lerp = (x, dMin, dMax, rMin, rMax) ->
  ratio = (x - dMin) / (dMax - dMin)
  return ratio * (rMax - rMin) + rMin

ticks = (spacing, min, max) ->
  first = Math.ceil(min / spacing)
  last = Math.floor(max / spacing)
  (x * spacing for x in [first..last])

drawLine = (ctx, [x1, y1], [x2, y2]) ->
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()

getSpacing = (pixelSize) ->
  # minSpacing is the minimum distance, in world coordinates, between major
  # grid lines.
  minSpacing = pixelSize * config.minGridSpacing

  ###
  need to determine:
    largeSpacing = {1, 2, or 5} * 10^n
    smallSpacing = divide largeSpacing by 4 (if 1 or 2) or 5 (if 5)
  largeSpacing must be greater than minSpacing
  ###
  div = 4
  largeSpacing = z = Math.pow(10, Math.ceil(Math.log(minSpacing) / Math.log(10)))
  if z / 5 > minSpacing
    largeSpacing = z / 5
  else if z / 2 > minSpacing
    largeSpacing = z / 2
    div = 5
  smallSpacing = largeSpacing / div

  return {largeSpacing, smallSpacing}


drawGrid = (ctx, center, pixelSize) ->
  {cxMin, cxMax, cyMin, cyMax, width, height} = canvasBounds(ctx)

  xMin = center[0] - (width  / 2) * pixelSize
  xMax = center[0] + (width  / 2) * pixelSize
  yMin = center[1] - (height / 2) * pixelSize
  yMax = center[1] + (height / 2) * pixelSize

  {cxMin, cxMax, cyMin, cyMax, width, height} = canvasBounds(ctx)

  {largeSpacing, smallSpacing} = getSpacing(pixelSize)

  toLocal = ([cx, cy]) ->
    [
      lerp(cx, cxMin, cxMax, xMin, xMax)
      lerp(cy, cyMin, cyMax, yMin, yMax)
    ]
  fromLocal = ([x, y]) ->
    [
      lerp(x, xMin, xMax, cxMin, cxMax)
      lerp(y, yMin, yMax, cyMin, cyMax)
    ]

  labelDistance = 5
  color = config.gridColor
  minorOpacity = 0.075
  majorOpacity = 0.1
  axesOpacity = 0.25
  labelOpacity = 1.0
  textHeight = 12

  minorColor = "rgba(#{color}, #{minorOpacity})"
  majorColor = "rgba(#{color}, #{majorOpacity})"
  axesColor = "rgba(#{color}, #{axesOpacity})"
  labelColor = "rgba(#{color}, #{labelOpacity})"

  ctx.save()
  ctx.lineWidth = 1


  # draw minor grid lines
  ctx.strokeStyle = minorColor
  for x in ticks(smallSpacing, xMin, xMax)
    drawLine(ctx, fromLocal([x, yMin]), fromLocal([x, yMax]))
  for y in ticks(smallSpacing, yMin, yMax)
    drawLine(ctx, fromLocal([xMin, y]), fromLocal([xMax, y]))

  # draw major grid lines
  ctx.strokeStyle = majorColor
  for x in ticks(largeSpacing, xMin, xMax)
    drawLine(ctx, fromLocal([x, yMin]), fromLocal([x, yMax]))
  for y in ticks(largeSpacing, yMin, yMax)
    drawLine(ctx, fromLocal([xMin, y]), fromLocal([xMax, y]))

  # draw axes
  ctx.strokeStyle = axesColor
  drawLine(ctx, fromLocal([0, yMin]), fromLocal([0, yMax]))
  drawLine(ctx, fromLocal([xMin, 0]), fromLocal([xMax, 0]))

  # draw labels
  ctx.font = "#{textHeight}px verdana"
  ctx.fillStyle = labelColor
  ctx.textAlign = "center"
  ctx.textBaseline = "top"
  for x in ticks(largeSpacing, xMin, xMax)
    if x != 0
      text = parseFloat(x.toPrecision(12)).toString()
      [cx, cy] = fromLocal([x, 0])
      if cx < cxMax
        cy += labelDistance
        if cy < labelDistance
          cy = labelDistance
        if cy + textHeight + labelDistance > height
          cy = height - labelDistance - textHeight
        ctx.fillText(text, cx, cy)
  ctx.textAlign = "left"
  ctx.textBaseline = "middle"
  for y in ticks(largeSpacing, yMin, yMax)
    if y != 0
      text = parseFloat(y.toPrecision(12)).toString()
      [cx, cy] = fromLocal([0, y])
      if cy > 0
        cx += labelDistance
        if cx < labelDistance
          cx = labelDistance
        if cx + ctx.measureText(text).width + labelDistance > width
          cx = width - labelDistance - ctx.measureText(text).width
        ctx.fillText(text, cx, cy)

  ctx.restore()

