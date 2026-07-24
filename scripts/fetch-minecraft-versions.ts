// scripts/fetch-minecraft-versions.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface FabricGameVersion {
  version: string;
  stable: boolean;
}

interface FabricLoaderVersion {
  version: string;
  stable: boolean;
}

interface LoaderData {
  loaderVersion: string;
  apiVersion?: string;
  loomVersion?: string;
  mappingsVersion?: string;
}

// ✅ FABRIC LOOM VERSIONS - STABLE RELEASES
// Disesuaikan agar menggunakan versi loom terbaru yang kompatibel dengan Gradle 8.14
const FABRIC_LOOM_VERSIONS: Record<string, string> = {
  '1.21': '1.11.7',
  '1.21.1': '1.11.7',
  '1.21.2': '1.11.7',
  '1.21.3': '1.11.7',
  '1.21.4': '1.11.7',
  '1.21.5': '1.11.7',
  '1.21.6': '1.11.7',
  '1.21.7': '1.11.7',
  '1.21.8': '1.11.7',
  '1.21.9': '1.11.7',
  '1.21.10': '1.11.7',
  '1.21.11': '1.11.7',
  '1.20': '1.7.4',
  '1.20.1': '1.7.4',
  '1.20.2': '1.7.4',
  '1.20.3': '1.7.4',
  '1.20.4': '1.7.4',
  '1.20.5': '1.7.4',
  '1.20.6': '1.7.4',
  '1.19': '1.6.12',
  '1.19.1': '1.6.12',
  '1.19.2': '1.6.12',
  '1.19.3': '1.6.12',
  '1.19.4': '1.6.12',
  '1.18': '1.5.14',
  '1.18.1': '1.5.14',
  '1.18.2': '1.5.14',
  '1.17': '1.4.12',
  '1.17.1': '1.4.12',
  '1.16': '1.3.11',
  '1.16.1': '1.3.11',
  '1.16.2': '1.3.11',
  '1.16.3': '1.3.11',
  '1.16.4': '1.3.11',
  '1.16.5': '1.3.11',
  'default': '1.7.4',
};

// ✅ FABRIC API VERSIONS
const FABRIC_API_VERSIONS: Record<string, string> = {
  '1.21.11': '0.135.2+1.21.11', // Diperbarui ke versi yang benar sesuai error sebelumnya
  '1.21.10': '0.106.1+1.21.10',
  '1.21.9': '0.106.1+1.21.9',
  '1.21.8': '0.106.1+1.21.8',
  '1.21.7': '0.106.1+1.21.7',
  '1.21.6': '0.106.1+1.21.6',
  '1.21.5': '0.106.1+1.21.5',
  '1.21.4': '0.106.1+1.21.4',
  '1.21.3': '0.106.1+1.21.3',
  '1.21.2': '0.106.1+1.21.2',
  '1.21.1': '0.106.1+1.21.1',
  '1.21': '0.106.1+1.21',
  '1.20.4': '0.97.0+1.20.4',
  '1.20.1': '0.91.1+1.20.1',
  '1.19.4': '0.87.1+1.19.4',
  '1.19.2': '0.76.1+1.19.2',
  '1.18.2': '0.67.1+1.18.2',
  '1.17.1': '0.46.1+1.17.1',
  '1.16.5': '0.34.1+1.16.5',
  'default': '0.91.1+1.20.4',
};

// ✅ MAPPINGS VERSIONS
const MAPPINGS_VERSIONS: Record<string, string> = {
  '1.21.11': '1.21.11+build.1',
  '1.21.10': '1.21.10+build.1',
  '1.21.9': '1.21.9+build.1',
  '1.21.8': '1.21.8+build.1',
  '1.21.7': '1.21.7+build.1',
  '1.21.6': '1.21.6+build.1',
  '1.21.5': '1.21.5+build.1',
  '1.21.4': '1.21.4+build.1',
  '1.21.3': '1.21.3+build.1',
  '1.21.2': '1.21.2+build.1',
  '1.21.1': '1.21.1+build.3',
  '1.21': '1.21+build.1',
  '1.20.4': '1.20.4+build.3',
  '1.20.1': '1.20.1+build.10',
  '1.19.4': '1.19.4+build.2',
  '1.19.2': '1.19.2+build.1',
  '1.18.2': '1.18.2+build.4',
  '1.17.1': '1.17.1+build.1',
  '1.16.5': '1.16.5+build.1',
  'default': '1.20.4+build.3',
};

// ✅ EXPLICIT MAPPINGS
const EXPLICIT_MAPPINGS: Record<string, Record<string, LoaderData>> = {
  '1.21.11': {
    FABRIC: {
      loaderVersion: '0.16.9',
      apiVersion: '0.135.2+1.21.11',
      loomVersion: '1.11.7', // Diperbarui ke versi Loom yang butuh Gradle 8.14
      mappingsVersion: '1.21.11+build.1'
    },
    QUILT: { loaderVersion: '0.27.0', apiVersion: '1.3.0+1.21.11' },
    FORGE: { loaderVersion: '55.0.0' },
    NEOFORGE: { loaderVersion: '21.3.0' },
  },
  '1.21.10': {
    FABRIC: {
      loaderVersion: '0.16.9',
      apiVersion: '0.106.1+1.21.10',
      loomVersion: '1.11.7',
      mappingsVersion: '1.21.10+build.1'
    },
  },
  '1.21.9': {
    FABRIC: {
      loaderVersion: '0.16.9',
      apiVersion: '0.106.1+1.21.9',
      loomVersion: '1.11.7',
      mappingsVersion: '1.21.9+build.1'
    },
  },
  '1.21.3': {
    FABRIC: {
      loaderVersion: '0.16.9',
      apiVersion: '0.106.1+1.21.3',
      loomVersion: '1.11.7',
      mappingsVersion: '1.21.3+build.1'
    },
    QUILT: { loaderVersion: '0.26.3', apiVersion: '1.2.1+1.21.3' },
    FORGE: { loaderVersion: '53.0.0' },
    NEOFORGE: { loaderVersion: '21.1.72' },
  },
  '1.21.1': {
    FABRIC: {
      loaderVersion: '0.16.9',
      apiVersion: '0.106.1+1.21.1',
      loomVersion: '1.11.7',
      mappingsVersion: '1.21.1+build.3'
    },
    QUILT: { loaderVersion: '0.26.3', apiVersion: '1.1.1+1.21.1' },
    FORGE: { loaderVersion: '51.0.32' },
    NEOFORGE: { loaderVersion: '21.0.167' },
  },
  '1.20.4': {
    FABRIC: {
      loaderVersion: '0.16.9',
      apiVersion: '0.97.0+1.20.4',
      loomVersion: '1.7.4',
      mappingsVersion: '1.20.4+build.3'
    },
    QUILT: { loaderVersion: '0.26.3', apiVersion: '0.92.0+1.20.4' },
    FORGE: { loaderVersion: '49.1.0' },
    NEOFORGE: { loaderVersion: '20.4.237' },
  },
  '1.20.1': {
    FABRIC: {
      loaderVersion: '0.15.11',
      apiVersion: '0.91.1+1.20.1',
      loomVersion: '1.7.4',
      mappingsVersion: '1.20.1+build.10'
    },
  },
};

// ✅ FUNGSI UNTUK FETCH DARI FABRIC API
async function fetchFabricVersions(): Promise<string[]> {
  try {
    const response = await fetch('https://meta.fabricmc.net/v2/versions/game');
    if (!response.ok) throw new Error(`Failed to fetch Fabric versions: ${response.status}`);
    const data: FabricGameVersion[] = await response.json();
    return data
      .filter(v => v.stable === true)
      .map(v => v.version);
  } catch (error) {
    console.error('Error fetching Fabric versions:', error);
    return [];
  }
}

async function fetchFabricLoaders(): Promise<string[]> {
  try {
    const response = await fetch('https://meta.fabricmc.net/v2/versions/loader');
    if (!response.ok) throw new Error(`Failed to fetch Fabric loaders: ${response.status}`);
    const data: FabricLoaderVersion[] = await response.json();
    return data
      .filter(v => v.stable === true)
      .map(v => v.version);
  } catch (error) {
    console.error('Error fetching Fabric loaders:', error);
    return [];
  }
}

// ✅ FUNGSI UNTUK MENENTUKAN JAVA & GRADLE (DIPERBAIKI)
function getJavaAndGradleVersion(mcVersion: string): { java: string, gradle: string } {
  const parts = mcVersion.split('.');
  const major = parseInt(parts[0] || '1');
  const minor = parseInt(parts[1] || '0');
  const patch = parseInt(parts[2] || '0');

  // Minecraft 1.20.5+ dan 1.21+ menggunakan Java 21 dan membutuhkan Gradle 8.14 untuk Loom 1.11.7+
  if ((major === 1 && minor >= 21) || (major === 1 && minor === 20 && patch >= 5)) {
    return { java: '21', gradle: '8.14' }; // 🔧 FIX UTAMA
  }
  // Minecraft 1.18 - 1.20.4
  if (major === 1 && minor >= 18) {
    return { java: '17', gradle: '8.5' };
  }
  // Minecraft 1.17
  if (major === 1 && minor === 17) {
    return { java: '16', gradle: '7.6' };
  }
  // Minecraft 1.16 ke bawah
  return { java: '8', gradle: '6.8.3' };
}

// ✅ GET LOOM VERSION
function getLoomVersion(mcVersion: string): string {
  for (const [prefix, version] of Object.entries(FABRIC_LOOM_VERSIONS)) {
    if (mcVersion.startsWith(prefix)) {
      return version;
    }
  }
  return FABRIC_LOOM_VERSIONS['default'];
}

// ✅ GET API VERSION
function getApiVersion(mcVersion: string): string {
  if (FABRIC_API_VERSIONS[mcVersion]) {
    return FABRIC_API_VERSIONS[mcVersion];
  }
  return FABRIC_API_VERSIONS['default'];
}

// ✅ GET MAPPINGS VERSION
function getMappingsVersion(mcVersion: string): string {
  if (MAPPINGS_VERSIONS[mcVersion]) {
    return MAPPINGS_VERSIONS[mcVersion];
  }
  return MAPPINGS_VERSIONS['default'];
}

// ✅ GENERATOR OTOMATIS UNTUK LOADER
function getLoaderInfo(loader: string, mcVersion: string): LoaderData | null {
  if (EXPLICIT_MAPPINGS[mcVersion]?.[loader]) {
    return EXPLICIT_MAPPINGS[mcVersion][loader];
  }

  if (loader === 'FABRIC') {
    return {
      loaderVersion: '0.16.9',
      apiVersion: getApiVersion(mcVersion),
      loomVersion: getLoomVersion(mcVersion),
      mappingsVersion: getMappingsVersion(mcVersion),
    };
  }

  switch (loader) {
    case 'PAPER':
    case 'SPIGOT':
      return { loaderVersion: `${mcVersion}-R0.1-SNAPSHOT` };
    case 'PURPUR':
    case 'FOLIA':
      return { loaderVersion: mcVersion };
    case 'VELOCITY':
      return { loaderVersion: '3.3.0-SNAPSHOT' };
    case 'WATERFALL':
    case 'BUNGEECORD':
      return { loaderVersion: mcVersion };
    case 'FORGE':
    case 'NEOFORGE':
    case 'QUILT':
      return null;
    default:
      return null;
  }
}

async function fetchMinecraftVersions() {
  try {
    console.log('🚀 Starting to fetch Minecraft versions...');

    // ✅ FETCH DARI MULTIPLE SOURCES
    const mojangResponse = await fetch('https://launchermeta.mojang.com/mc/game/version_manifest.json');
    if (!mojangResponse.ok) throw new Error(`Failed to fetch Mojang manifest: ${mojangResponse.status}`);
    const mojangManifest = await mojangResponse.json();

    const fabricVersions = await fetchFabricVersions();
    const fabricLoaders = await fetchFabricLoaders();

    console.log(`📦 Found ${mojangManifest.versions.length} Mojang versions`);
    console.log(`📦 Found ${fabricVersions.length} Fabric-supported versions`);
    console.log(`📦 Found ${fabricLoaders.length} Fabric loader versions`);

    const latestRelease = mojangManifest.latest.release;
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    let loaderCount = 0;

    // ✅ GABUNGKAN DAFTAR VERSI DARI MOJANG DAN FABRIC
    const allVersions = new Set<string>();

    // Dari Mojang
    for (const v of mojangManifest.versions) {
      if (v.type === 'release') {
        const parts = v.id.split('.');
        const major = parseInt(parts[0] || '1');
        const minor = parseInt(parts[1] || '0');
        if (major === 1 && minor >= 14) {
          allVersions.add(v.id);
        }
      }
    }

    // Dari Fabric
    for (const v of fabricVersions) {
      allVersions.add(v);
    }

    console.log(`📋 Total unique versions to process: ${allVersions.size}`);

    for (const versionId of allVersions) {
      try {
        // Skip snapshot/alpha/beta
        if (versionId.includes('pre') || versionId.includes('rc') ||
            versionId.includes('alpha') || versionId.includes('beta') ||
            versionId.includes('snapshot')) {
          skippedCount++;
          continue;
        }

        const isLatest = versionId === latestRelease;
        const javaInfo = getJavaAndGradleVersion(versionId);

        const existing = await prisma.minecraftVersion.findUnique({
          where: { version: versionId },
        });

        let createdMc;
        if (existing) {
          createdMc = await prisma.minecraftVersion.update({
            where: { version: versionId },
            data: {
              isLatest: isLatest,
              releaseDate: new Date(),
            },
          });
          updatedCount++;
          console.log(`🔄 Updated version: ${createdMc.version}`);
        } else {
          createdMc = await prisma.minecraftVersion.create({
            data: {
              version: versionId,
              platform: 'JAVA',
              isLatest: isLatest,
              isSnapshot: false,
              releaseDate: new Date(),
            },
          });
          createdCount++;
          console.log(`✅ Created version: ${createdMc.version}`);
        }

        const javaLoaders = [
          'FABRIC', 'FORGE', 'NEOFORGE', 'QUILT',
          'PAPER', 'SPIGOT', 'PURPUR', 'FOLIA',
          'VELOCITY', 'WATERFALL', 'BUNGEECORD'
        ];

        for (const loaderName of javaLoaders) {
          const loaderInfo = getLoaderInfo(loaderName, versionId);

          if (!loaderInfo) continue;

          const existingLoaderMapping = await prisma.loaderMinecraftVersion.findFirst({
            where: {
              loader: loaderName as any,
              minecraftVersionId: createdMc.id,
            },
          });

          if (existingLoaderMapping) {
            await prisma.loaderMinecraftVersion.update({
              where: { id: existingLoaderMapping.id },
              data: {
                loaderVersion: loaderInfo.loaderVersion,
                apiVersion: loaderInfo.apiVersion || null,
                loomVersion: loaderInfo.loomVersion || null,
                mappingsVersion: loaderInfo.mappingsVersion || null,
                gradleVersion: javaInfo.gradle,
                javaVersion: javaInfo.java,
                jdkVersion: javaInfo.java,
                recommended: isLatest,
                supported: true,
              },
            });
            console.log(`  🔄 Updated ${loaderName} ${loaderInfo.loaderVersion}`);
          } else {
            await prisma.loaderMinecraftVersion.create({
              data: {
                loader: loaderName as any,
                minecraftVersionId: createdMc.id,
                loaderVersion: loaderInfo.loaderVersion,
                apiVersion: loaderInfo.apiVersion || null,
                loomVersion: loaderInfo.loomVersion || null,
                mappingsVersion: loaderInfo.mappingsVersion || null,
                gradleVersion: javaInfo.gradle,
                javaVersion: javaInfo.java,
                jdkVersion: javaInfo.java,
                recommended: isLatest,
                supported: true,
              },
            });
            console.log(`  📝 Added ${loaderName} ${loaderInfo.loaderVersion}`);
          }
          loaderCount++;
        }

      } catch (error) {
        console.error(`❌ Error processing version ${versionId}:`, error);
        errorCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Created: ${createdCount} Minecraft versions`);
    console.log(`🔄 Updated: ${updatedCount} Minecraft versions`);
    console.log(`📝 Created/Updated: ${loaderCount} Loader mappings`);
    console.log(`⏭️ Skipped: ${skippedCount} snapshot/old versions`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('🎉 Done fetching data!');

    const availableVersions = await prisma.minecraftVersion.findMany({
      where: { platform: 'JAVA' },
      orderBy: { version: 'desc' },
      select: { version: true, isLatest: true },
      take: 20,
    });
    console.log('\n📋 Latest JAVA versions:');
    availableVersions.forEach(v => {
      console.log(`  - ${v.version} ${v.isLatest ? '(Latest)' : ''}`);
    });

  } catch (error) {
    console.error('❌ Fatal Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fetchMinecraftVersions();