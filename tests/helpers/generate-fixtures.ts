import sharp from 'sharp';
import * as fs from 'fs/promises';
import * as path from 'path';

const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');

async function generateFixture(
  name: string,
  width: number,
  height: number,
  backgroundColor: string = '#667eea'
) {
  const buffer = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: backgroundColor,
    },
  })
    .png()
    .toBuffer();

  await fs.mkdir(FIXTURES_DIR, { recursive: true });
  await fs.writeFile(path.join(FIXTURES_DIR, name), buffer);
  console.log(`Created: ${name} (${width}×${height})`);
}

async function main() {
  await generateFixture('screenshot-1280x720.png', 1280, 720);
  await generateFixture('screenshot-720x1280.png', 720, 1280);
  await generateFixture('screenshot-4k.png', 3840, 2160);
  await generateFixture('screenshot-small.png', 400, 300);
  await generateFixture('screenshot-ultrawide.png', 2560, 1080);
}

main().catch(console.error);
