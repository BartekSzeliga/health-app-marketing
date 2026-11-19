import Foundation
import ImageIO
import Vision

guard CommandLine.arguments.count == 2 else {
    fputs("usage: swift decode-qr.swift <image>\n", stderr)
    exit(2)
}

let imageUrl = URL(fileURLWithPath: CommandLine.arguments[1])
guard
    let source = CGImageSourceCreateWithURL(imageUrl as CFURL, nil),
    let image = CGImageSourceCreateImageAtIndex(source, 0, nil)
else {
    fputs("could not load image: \(imageUrl.path)\n", stderr)
    exit(2)
}

let request = VNDetectBarcodesRequest()
request.symbologies = [.qr]

do {
    try VNImageRequestHandler(cgImage: image).perform([request])
} catch {
    fputs("QR detection failed: \(error)\n", stderr)
    exit(1)
}

let values = (request.results ?? []).compactMap(\.payloadStringValue).sorted()
for value in values {
    print(value)
}

if values.isEmpty {
    fputs("no QR code decoded\n", stderr)
    exit(1)
}
