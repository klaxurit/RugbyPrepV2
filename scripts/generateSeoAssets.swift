import AppKit
import Foundation

struct Palette {
  static let background = NSColor(calibratedRed: 0x12 / 255.0, green: 0x0C / 255.0, blue: 0x09 / 255.0, alpha: 1)
  static let panel = NSColor(calibratedRed: 0x1D / 255.0, green: 0x13 / 255.0, blue: 0x0E / 255.0, alpha: 1)
  static let green = NSColor(calibratedRed: 0x1A / 255.0, green: 0x5F / 255.0, blue: 0x3F / 255.0, alpha: 1)
  static let orange = NSColor(calibratedRed: 0xFF / 255.0, green: 0x6B / 255.0, blue: 0x35 / 255.0, alpha: 1)
  static let text = NSColor(calibratedRed: 0xF8 / 255.0, green: 0xF2 / 255.0, blue: 0xEA / 255.0, alpha: 1)
  static let muted = NSColor(calibratedRed: 0xD2 / 255.0, green: 0xC9 / 255.0, blue: 0xBF / 255.0, alpha: 1)
  static let soft = NSColor(calibratedWhite: 1, alpha: 0.08)
}

func withBitmap(width: Int, height: Int, draw: (NSRect) -> Void) -> NSBitmapImageRep {
  let rep = NSBitmapImageRep(
    bitmapDataPlanes: nil,
    pixelsWide: width,
    pixelsHigh: height,
    bitsPerSample: 8,
    samplesPerPixel: 4,
    hasAlpha: true,
    isPlanar: false,
    colorSpaceName: .deviceRGB,
    bytesPerRow: 0,
    bitsPerPixel: 0
  )!

  rep.size = NSSize(width: width, height: height)
  NSGraphicsContext.saveGraphicsState()
  let context = NSGraphicsContext(bitmapImageRep: rep)!
  NSGraphicsContext.current = context
  context.cgContext.interpolationQuality = .high
  draw(NSRect(x: 0, y: 0, width: width, height: height))
  context.flushGraphics()
  NSGraphicsContext.restoreGraphicsState()
  return rep
}

func writePNG(_ rep: NSBitmapImageRep, to path: String) throws {
  guard let data = rep.representation(using: .png, properties: [:]) else {
    throw NSError(domain: "RugbyForgeSEOAssets", code: 1, userInfo: [NSLocalizedDescriptionKey: "Unable to encode PNG"])
  }
  let url = URL(fileURLWithPath: path)
  try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
  try data.write(to: url)
}

func drawRoundedPanel(_ rect: NSRect, radius: CGFloat, color: NSColor) {
  let path = NSBezierPath(roundedRect: rect, xRadius: radius, yRadius: radius)
  color.setFill()
  path.fill()
}

func drawText(_ text: String, in rect: NSRect, font: NSFont, color: NSColor, alignment: NSTextAlignment = .left) {
  let paragraph = NSMutableParagraphStyle()
  paragraph.alignment = alignment
  let attrs: [NSAttributedString.Key: Any] = [
    .font: font,
    .foregroundColor: color,
    .paragraphStyle: paragraph,
  ]
  NSString(string: text).draw(in: rect, withAttributes: attrs)
}

func drawIcon(size: Int) -> NSBitmapImageRep {
  withBitmap(width: size, height: size) { rect in
    drawRoundedPanel(rect.insetBy(dx: 0, dy: 0), radius: CGFloat(size) * 0.23, color: Palette.background)

    let flare1 = NSBezierPath(ovalIn: NSRect(x: rect.maxX - CGFloat(size) * 0.48, y: rect.maxY - CGFloat(size) * 0.4, width: CGFloat(size) * 0.42, height: CGFloat(size) * 0.42))
    NSColor(calibratedRed: 1, green: 0.42, blue: 0.21, alpha: 0.12).setFill()
    flare1.fill()

    let flare2 = NSBezierPath(ovalIn: NSRect(x: CGFloat(size) * 0.04, y: CGFloat(size) * 0.02, width: CGFloat(size) * 0.38, height: CGFloat(size) * 0.38))
    NSColor(calibratedRed: 0.10, green: 0.37, blue: 0.25, alpha: 0.22).setFill()
    flare2.fill()

    let inner = NSRect(x: CGFloat(size) * 0.09, y: CGFloat(size) * 0.09, width: CGFloat(size) * 0.82, height: CGFloat(size) * 0.82)
    drawRoundedPanel(inner, radius: CGFloat(size) * 0.18, color: Palette.panel)

    let gridColor = NSColor(calibratedWhite: 1, alpha: 0.06)
    for x in stride(from: inner.minX + CGFloat(size) * 0.06, to: inner.maxX, by: CGFloat(size) * 0.095) {
      for y in stride(from: inner.minY + CGFloat(size) * 0.06, to: inner.maxY, by: CGFloat(size) * 0.095) {
        let dot = NSBezierPath(ovalIn: NSRect(x: x, y: y, width: CGFloat(size) * 0.008, height: CGFloat(size) * 0.008))
        gridColor.setFill()
        dot.fill()
      }
    }

    let letterSize = CGFloat(size) * 0.32
    drawText(
      "R",
      in: NSRect(x: CGFloat(size) * 0.18, y: CGFloat(size) * 0.14, width: CGFloat(size) * 0.26, height: CGFloat(size) * 0.45),
      font: .systemFont(ofSize: letterSize, weight: .black),
      color: Palette.green
    )

    drawText(
      "F",
      in: NSRect(x: CGFloat(size) * 0.47, y: CGFloat(size) * 0.14, width: CGFloat(size) * 0.24, height: CGFloat(size) * 0.45),
      font: .systemFont(ofSize: letterSize, weight: .black),
      color: Palette.orange
    )

    let ballRect = NSRect(x: CGFloat(size) * 0.49, y: CGFloat(size) * 0.31, width: CGFloat(size) * 0.19, height: CGFloat(size) * 0.27)
    let ball = NSBezierPath(ovalIn: ballRect)
    let transform = AffineTransform(rotationByDegrees: 15)
    ball.transform(using: transform)
    NSColor(calibratedWhite: 1, alpha: 0.22).setStroke()
    ball.lineWidth = CGFloat(size) * 0.02
    ball.stroke()

    let arc = NSBezierPath()
    arc.move(to: NSPoint(x: CGFloat(size) * 0.2, y: CGFloat(size) * 0.18))
    arc.curve(
      to: NSPoint(x: CGFloat(size) * 0.8, y: CGFloat(size) * 0.18),
      controlPoint1: NSPoint(x: CGFloat(size) * 0.35, y: CGFloat(size) * 0.06),
      controlPoint2: NSPoint(x: CGFloat(size) * 0.65, y: CGFloat(size) * 0.06)
    )
    NSColor(calibratedWhite: 1, alpha: 0.12).setStroke()
    arc.lineWidth = CGFloat(size) * 0.03
    arc.lineCapStyle = .round
    arc.stroke()
  }
}

func drawOGImage() -> NSBitmapImageRep {
  withBitmap(width: 1200, height: 630) { rect in
    drawRoundedPanel(rect, radius: 0, color: Palette.background)

    NSColor(calibratedRed: 1, green: 0.42, blue: 0.21, alpha: 0.14).setFill()
    NSBezierPath(ovalIn: NSRect(x: 820, y: 396, width: 300, height: 300)).fill()
    NSColor(calibratedRed: 0.10, green: 0.37, blue: 0.25, alpha: 0.22).setFill()
    NSBezierPath(ovalIn: NSRect(x: -40, y: -40, width: 280, height: 280)).fill()

    let panel = NSRect(x: 58, y: 58, width: 1084, height: 514)
    drawRoundedPanel(panel, radius: 36, color: Palette.panel)

    let border = NSBezierPath(roundedRect: panel, xRadius: 36, yRadius: 36)
    NSColor(calibratedWhite: 1, alpha: 0.08).setStroke()
    border.lineWidth = 2
    border.stroke()

    for x in stride(from: panel.minX + 26, to: panel.maxX - 20, by: 26) {
      for y in stride(from: panel.minY + 24, to: panel.maxY - 18, by: 26) {
        let dot = NSBezierPath(ovalIn: NSRect(x: x, y: y, width: 1.7, height: 1.7))
        NSColor(calibratedWhite: 1, alpha: 0.04).setFill()
        dot.fill()
      }
    }

    drawText("RUGBY", in: NSRect(x: 120, y: 430, width: 360, height: 88), font: .systemFont(ofSize: 92, weight: .black), color: Palette.green)
    drawText("FORGE", in: NSRect(x: 472, y: 430, width: 380, height: 88), font: .systemFont(ofSize: 92, weight: .black), color: Palette.orange)
    drawText("Preparation physique rugby personnalisee", in: NSRect(x: 120, y: 332, width: 610, height: 60), font: .systemFont(ofSize: 46, weight: .bold), color: Palette.text)
    drawText("Programmes adaptes au poste, suivi ACWR, tests physiques", in: NSRect(x: 120, y: 275, width: 620, height: 34), font: .systemFont(ofSize: 28, weight: .medium), color: Palette.muted)
    drawText("prevention blessures et outils concrets pour joueurs et staffs", in: NSRect(x: 120, y: 236, width: 650, height: 34), font: .systemFont(ofSize: 28, weight: .medium), color: Palette.muted)

    let button = NSRect(x: 120, y: 124, width: 248, height: 70)
    drawRoundedPanel(button, radius: 18, color: Palette.orange)
    drawText("rugbyforge.fr", in: NSRect(x: 146, y: 144, width: 210, height: 36), font: .systemFont(ofSize: 27, weight: .bold), color: .white)

    let appCard = NSRect(x: 760, y: 154, width: 284, height: 322)
    drawRoundedPanel(appCard, radius: 34, color: NSColor(calibratedRed: 0x20 / 255.0, green: 0x15 / 255.0, blue: 0x10 / 255.0, alpha: 1))
    let appBorder = NSBezierPath(roundedRect: appCard, xRadius: 34, yRadius: 34)
    NSColor(calibratedWhite: 1, alpha: 0.08).setStroke()
    appBorder.lineWidth = 2
    appBorder.stroke()

    drawRoundedPanel(NSRect(x: 790, y: 402, width: 220, height: 18), radius: 9, color: NSColor(calibratedWhite: 1, alpha: 0.08))
    drawRoundedPanel(NSRect(x: 790, y: 338, width: 176, height: 52), radius: 18, color: Palette.green)
    drawRoundedPanel(NSRect(x: 790, y: 244, width: 220, height: 76), radius: 22, color: NSColor(calibratedWhite: 1, alpha: 0.05))
    drawRoundedPanel(NSRect(x: 790, y: 178, width: 104, height: 50), radius: 17, color: Palette.orange)
    drawRoundedPanel(NSRect(x: 906, y: 178, width: 104, height: 50), radius: 17, color: NSColor(calibratedWhite: 1, alpha: 0.07))
  }
}

let fileManager = FileManager.default
let projectRoot = fileManager.currentDirectoryPath

do {
  try writePNG(drawIcon(size: 192), to: "\(projectRoot)/public/icons/icon-192.png")
  try writePNG(drawIcon(size: 512), to: "\(projectRoot)/public/icons/icon-512.png")
  try writePNG(drawOGImage(), to: "\(projectRoot)/public/og-rugbyforge.png")
  print("Generated SEO assets in public/icons and public/og-rugbyforge.png")
} catch {
  fputs("Failed to generate SEO assets: \(error.localizedDescription)\n", stderr)
  exit(1)
}
