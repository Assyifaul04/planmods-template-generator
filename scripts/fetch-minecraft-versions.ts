// scripts/fetch-minecraft-versions.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MojangVersion {
  id: string;
  type: string;
  url: string;
  time: string;
  releaseTime: string;
}

interface MojangVersionManifest {
  latest: {
    release: string;
    snapshot: string;
  };
  versions: MojangVersion[];
}

// Loader configurations with Java 17+ support
const LOADER_CONFIGS = {
  FABRIC: {
    versions: [
      { loaderVersion: '0.16.9', apiVersion: '0.100.0', loomVersion: '1.7-SNAPSHOT' },
      { loaderVersion: '0.16.8', apiVersion: '0.100.0', loomVersion: '1.7-SNAPSHOT' },
      { loaderVersion: '0.16.7', apiVersion: '0.99.0', loomVersion: '1.6-SNAPSHOT' },
      { loaderVersion: '0.16.6', apiVersion: '0.99.0', loomVersion: '1.6-SNAPSHOT' },
      { loaderVersion: '0.16.5', apiVersion: '0.98.0', loomVersion: '1.6-SNAPSHOT' },
      { loaderVersion: '0.16.4', apiVersion: '0.98.0', loomVersion: '1.6-SNAPSHOT' },
      { loaderVersion: '0.16.3', apiVersion: '0.97.0', loomVersion: '1.6-SNAPSHOT' },
      { loaderVersion: '0.16.2', apiVersion: '0.97.0', loomVersion: '1.6-SNAPSHOT' },
      { loaderVersion: '0.16.1', apiVersion: '0.96.0', loomVersion: '1.5-SNAPSHOT' },
      { loaderVersion: '0.16.0', apiVersion: '0.96.0', loomVersion: '1.5-SNAPSHOT' },
      { loaderVersion: '0.15.11', apiVersion: '0.90.0', loomVersion: '1.5-SNAPSHOT' },
    ],
    gradleVersion: '8.8',
    javaVersion: '21',
  },
  FORGE: {
    versions: [
      { loaderVersion: '52.0.0', apiVersion: '1.0.0' },
      { loaderVersion: '51.0.0', apiVersion: '1.0.0' },
      { loaderVersion: '50.0.0', apiVersion: '1.0.0' },
      { loaderVersion: '49.0.0', apiVersion: '1.0.0' },
      { loaderVersion: '48.0.0', apiVersion: '1.0.0' },
      { loaderVersion: '47.3.0', apiVersion: '1.0.0' },
      { loaderVersion: '47.2.0', apiVersion: '1.0.0' },
      { loaderVersion: '47.1.0', apiVersion: '1.0.0' },
      { loaderVersion: '47.0.0', apiVersion: '1.0.0' },
      { loaderVersion: '46.1.0', apiVersion: '1.0.0' },
    ],
    gradleVersion: '8.8',
    javaVersion: '21',
  },
  NEOFORGE: {
    versions: [
      { loaderVersion: '21.1.100-beta', apiVersion: '21.1' },
      { loaderVersion: '21.1.99-beta', apiVersion: '21.1' },
      { loaderVersion: '21.1.98-beta', apiVersion: '21.1' },
      { loaderVersion: '21.1.97-beta', apiVersion: '21.1' },
      { loaderVersion: '21.1.96-beta', apiVersion: '21.1' },
      { loaderVersion: '21.1.95-beta', apiVersion: '21.1' },
      { loaderVersion: '21.1.94-beta', apiVersion: '21.1' },
      { loaderVersion: '21.1.93-beta', apiVersion: '21.1' },
      { loaderVersion: '21.1.92-beta', apiVersion: '21.1' },
      { loaderVersion: '21.1.91-beta', apiVersion: '21.1' },
      { loaderVersion: '20.4.100-beta', apiVersion: '20.4' },
    ],
    gradleVersion: '8.8',
    javaVersion: '21',
  },
  QUILT: {
    versions: [
      { loaderVersion: '0.25.0', apiVersion: '0.20.0' },
      { loaderVersion: '0.24.0', apiVersion: '0.20.0' },
      { loaderVersion: '0.23.0', apiVersion: '0.20.0' },
      { loaderVersion: '0.22.0', apiVersion: '0.20.0' },
      { loaderVersion: '0.21.0', apiVersion: '0.20.0' },
      { loaderVersion: '0.20.0', apiVersion: '0.20.0' },
    ],
    gradleVersion: '8.8',
    javaVersion: '21',
  },
  PAPER: {
    versions: [
      { loaderVersion: '1.21.3-R0.1-SNAPSHOT' },
      { loaderVersion: '1.21.2-R0.1-SNAPSHOT' },
      { loaderVersion: '1.21.1-R0.1-SNAPSHOT' },
      { loaderVersion: '1.21-R0.1-SNAPSHOT' },
      { loaderVersion: '1.20.6-R0.1-SNAPSHOT' },
      { loaderVersion: '1.20.5-R0.1-SNAPSHOT' },
      { loaderVersion: '1.20.4-R0.1-SNAPSHOT' },
      { loaderVersion: '1.20.3-R0.1-SNAPSHOT' },
      { loaderVersion: '1.20.2-R0.1-SNAPSHOT' },
      { loaderVersion: '1.20.1-R0.1-SNAPSHOT' },
      { loaderVersion: '1.20-R0.1-SNAPSHOT' },
    ],
    gradleVersion: '8.8',
    javaVersion: '21',
  },
  SPIGOT: {
    versions: [
      { loaderVersion: '1.21.3-R0.1-SNAPSHOT' },
      { loaderVersion: '1.21.2-R0.1-SNAPSHOT' },
      { loaderVersion: '1.21.1-R0.1-SNAPSHOT' },
      { loaderVersion: '1.21-R0.1-SNAPSHOT' },
      { loaderVersion: '1.20.6-R0.1-SNAPSHOT' },
      { loaderVersion: '1.20.5-R0.1-SNAPSHOT' },
      { loaderVersion: '1.20.4-R0.1-SNAPSHOT' },
      { loaderVersion: '1.20.3-R0.1-SNAPSHOT' },
      { loaderVersion: '1.20.2-R0.1-SNAPSHOT' },
      { loaderVersion: '1.20.1-R0.1-SNAPSHOT' },
      { loaderVersion: '1.20-R0.1-SNAPSHOT' },
    ],
    gradleVersion: '8.8',
    javaVersion: '21',
  },
  PURPUR: {
    versions: [
      { loaderVersion: '1.21.3' },
      { loaderVersion: '1.21.2' },
      { loaderVersion: '1.21.1' },
      { loaderVersion: '1.21' },
      { loaderVersion: '1.20.6' },
      { loaderVersion: '1.20.5' },
      { loaderVersion: '1.20.4' },
      { loaderVersion: '1.20.3' },
      { loaderVersion: '1.20.2' },
      { loaderVersion: '1.20.1' },
      { loaderVersion: '1.20' },
    ],
    gradleVersion: '8.8',
    javaVersion: '21',
  },
  FOLIA: {
    versions: [
      { loaderVersion: '1.21.3' },
      { loaderVersion: '1.21.2' },
      { loaderVersion: '1.21.1' },
      { loaderVersion: '1.21' },
      { loaderVersion: '1.20.6' },
      { loaderVersion: '1.20.5' },
      { loaderVersion: '1.20.4' },
      { loaderVersion: '1.20.3' },
      { loaderVersion: '1.20.2' },
      { loaderVersion: '1.20.1' },
      { loaderVersion: '1.20' },
    ],
    gradleVersion: '8.8',
    javaVersion: '21',
  },
  VELOCITY: {
    versions: [
      { loaderVersion: '3.3.0-SNAPSHOT' },
      { loaderVersion: '3.2.0-SNAPSHOT' },
      { loaderVersion: '3.1.0-SNAPSHOT' },
      { loaderVersion: '3.0.0-SNAPSHOT' },
    ],
    gradleVersion: '8.8',
    javaVersion: '21',
  },
  WATERFALL: {
    versions: [
      { loaderVersion: '1.21' },
      { loaderVersion: '1.20' },
      { loaderVersion: '1.19' },
    ],
    gradleVersion: '8.8',
    javaVersion: '21',
  },
  BUNGEECORD: {
    versions: [
      { loaderVersion: '1.21' },
      { loaderVersion: '1.20' },
      { loaderVersion: '1.19' },
    ],
    gradleVersion: '8.8',
    javaVersion: '21',
  },
  ADDON: {
    versions: [
      { loaderVersion: '1.0.0' },
    ],
    gradleVersion: '8.8',
    javaVersion: '21',
  },
  SCRIPT: {
    versions: [
      { loaderVersion: '1.0.0' },
    ],
    gradleVersion: '8.8',
    javaVersion: '21',
  },
};

// Function to get the latest loader version for a specific loader
function getLatestLoaderVersion(loader: string, mcVersion: string): any {
  const config = LOADER_CONFIGS[loader as keyof typeof LOADER_CONFIGS];
  if (!config) return null;
  
  // Return the first (latest) version
  return config.versions[0] || null;
}

// Function to get loader config with Java 17+ support
function getLoaderConfig(loader: string): any {
  const config = LOADER_CONFIGS[loader as keyof typeof LOADER_CONFIGS];
  if (!config) return null;
  
  return {
    gradleVersion: config.gradleVersion || '8.8',
    javaVersion: config.javaVersion || '21',
  };
}

async function fetchMinecraftVersions() {
  try {
    console.log('🚀 Starting to fetch ALL Minecraft versions from Mojang...');
    
    const manifestResponse = await fetch('https://launchermeta.mojang.com/mc/game/version_manifest.json');
    
    if (!manifestResponse.ok) {
      throw new Error(`Failed to fetch manifest: ${manifestResponse.status}`);
    }
    
    const manifest: MojangVersionManifest = await manifestResponse.json();
    
    console.log(`📦 Found ${manifest.versions.length} versions in manifest`);
    
    const latestRelease = manifest.latest.release;
    const latestSnapshot = manifest.latest.snapshot;
    
    console.log(`📌 Latest Release: ${latestRelease}`);
    console.log(`📌 Latest Snapshot: ${latestSnapshot}`);
    
    // Process ALL versions (removed the slice limit)
    const versionsToProcess = manifest.versions;
    console.log(`🔄 Processing ALL ${versionsToProcess.length} versions...`);
    
    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // Track progress
    let processed = 0;
    const total = versionsToProcess.length;
    
    for (const version of versionsToProcess) {
      processed++;
      // Show progress every 10 versions
      if (processed % 10 === 0) {
        console.log(`📊 Progress: ${processed}/${total} (${Math.round(processed/total * 100)}%)`);
      }
      
      // Skip very old versions (pre-1.14) to save time
      const versionNum = parseFloat(version.id);
      if (versionNum < 1.14) {
        console.log(`⏭️ Skipping old version: ${version.id}`);
        skippedCount++;
        continue;
      }
      
      // Skip if it's a snapshot
      if (version.type === 'snapshot') {
        console.log(`⏭️ Skipping snapshot: ${version.id}`);
        skippedCount++;
        continue;
      }
      
      try {
        // Check if version already exists
        const existing = await prisma.minecraftVersion.findUnique({
          where: { version: version.id },
        });
        
        if (existing) {
          console.log(`⏭️ Version ${version.id} already exists, skipping...`);
          skippedCount++;
          continue;
        }
        
        // Determine platform (Java only for now)
        const platform = 'JAVA';
        const isLatest = version.id === latestRelease;
        const isSnapshot = version.type === 'snapshot';
        
        // Create the Minecraft version
        const created = await prisma.minecraftVersion.create({
          data: {
            version: version.id,
            platform,
            isLatest,
            isSnapshot,
            releaseDate: new Date(version.releaseTime),
          },
        });
        
        console.log(`✅ Created version: ${created.version}`);
        createdCount++;
        
        // Create loader mappings for this version
        const loadersToCreate = [
          { loader: 'FABRIC' },
          { loader: 'FORGE' },
          { loader: 'NEOFORGE' },
          { loader: 'QUILT' },
          { loader: 'PAPER' },
          { loader: 'SPIGOT' },
          { loader: 'PURPUR' },
          { loader: 'FOLIA' },
          { loader: 'VELOCITY' },
          { loader: 'WATERFALL' },
          { loader: 'BUNGEECORD' },
          { loader: 'ADDON' },
          { loader: 'SCRIPT' },
        ];
        
        for (const loaderData of loadersToCreate) {
          // Get loader configuration
          const loaderConfig = getLoaderConfig(loaderData.loader);
          const latestVersion = getLatestLoaderVersion(loaderData.loader, version.id);
          
          if (!loaderConfig || !latestVersion) {
            console.log(`  ⏭️ Skipping ${loaderData.loader} - no config available`);
            continue;
          }
          
          // Only add loaders that are compatible with Java 17+
          // All our loaders now support Java 17+
          
          // Create the loader mapping
          await prisma.loaderMinecraftVersion.create({
            data: {
              loader: loaderData.loader,
              minecraftVersionId: created.id,
              loaderVersion: latestVersion.loaderVersion,
              apiVersion: latestVersion.apiVersion || null,
              loomVersion: latestVersion.loomVersion || null,
              gradleVersion: loaderConfig.gradleVersion,
              javaVersion: loaderConfig.javaVersion,
              recommended: isLatest,
              supported: true,
            },
          });
          console.log(`  ✅ Added ${loaderData.loader} ${latestVersion.loaderVersion} for ${version.id} (Java ${loaderConfig.javaVersion})`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing version ${version.id}:`, error);
        errorCount++;
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`✅ Created: ${createdCount} versions`);
    console.log(`⏭️ Skipped: ${skippedCount} versions`);
    console.log(`❌ Errors: ${errorCount} versions`);
    console.log('🎉 Done fetching ALL Minecraft versions!');
    
  } catch (error) {
    console.error('❌ Error fetching Minecraft versions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fetchMinecraftVersions();