<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use MongoDB\BSON\Document;
use MongoDB\Client;

class BackupMongoDatabase extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:backup-mongo
                            {--uri= : Custom MongoDB URI to backup from (defaults to config database.connections.mongodb.dsn)}
                            {--database= : Custom database name (defaults to config database.connections.mongodb.database)}
                            {--output= : Custom output directory inside storage/app/backups}
                            {--restore-from= : Restore collections from a backup folder path into the target database}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Backup atau restore seluruh collection MongoDB Cloud ke/dari format BSON Extended JSON.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $uri = (string) ($this->option('uri') ?: config('database.connections.mongodb.dsn'));
        $databaseName = (string) ($this->option('database') ?: config('database.connections.mongodb.database', 'skillventura'));

        if ($uri === '') {
            $this->error('MONGODB_URI belum dikonfigurasi.');

            return self::FAILURE;
        }

        $restoreFrom = $this->option('restore-from');
        if (is_string($restoreFrom) && $restoreFrom !== '') {
            return $this->restoreDatabase($uri, $databaseName, $restoreFrom);
        }

        $timestamp = now()->format('Y-m-d_H-i-s');
        $folderName = (string) ($this->option('output') ?: "mongodb-{$databaseName}-{$timestamp}");
        $backupDir = storage_path("app/backups/{$folderName}");

        if (! File::exists($backupDir)) {
            File::makeDirectory($backupDir, 0755, true);
        }

        $this->info("Menghubungkan ke MongoDB Cloud (Database: {$databaseName})...");

        try {
            $client = new Client($uri);
            $db = $client->selectDatabase($databaseName);

            $collections = iterator_to_array($db->listCollections());
        } catch (\Throwable $e) {
            $this->error('Gagal terhubung ke MongoDB: '.$e->getMessage());

            return self::FAILURE;
        }

        if (count($collections) === 0) {
            $this->warn("Database '{$databaseName}' tidak memiliki collection untuk di-backup.");

            return self::SUCCESS;
        }

        $manifest = [
            'database' => $databaseName,
            'backed_up_at' => now()->toIso8601String(),
            'collections' => [],
        ];

        $totalDocs = 0;

        foreach ($collections as $collectionInfo) {
            $collectionName = $collectionInfo->getName();

            if (str_starts_with($collectionName, 'system.')) {
                continue;
            }

            $collection = $db->selectCollection($collectionName);
            $cursor = $collection->find([], ['typeMap' => ['root' => 'bson']]);

            $filePath = "{$backupDir}/{$collectionName}.ejson";
            $handle = fopen($filePath, 'wb');

            if ($handle === false) {
                $this->error("Gagal membuat file backup untuk collection {$collectionName}");

                return self::FAILURE;
            }

            $docCount = 0;
            foreach ($cursor as $bsonDoc) {
                if ($bsonDoc instanceof Document) {
                    fwrite($handle, $bsonDoc->toCanonicalExtendedJSON().PHP_EOL);
                } else {
                    $doc = Document::fromPHP($bsonDoc);
                    fwrite($handle, $doc->toCanonicalExtendedJSON().PHP_EOL);
                }
                $docCount++;
            }

            fclose($handle);

            $manifest['collections'][$collectionName] = [
                'count' => $docCount,
                'file' => "{$collectionName}.ejson",
            ];
            $totalDocs += $docCount;

            $this->line("  ✔ Collection <info>{$collectionName}</info>: {$docCount} dokumen disimpan.");
        }

        File::put(
            "{$backupDir}/manifest.json",
            json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
        );

        $this->newLine();
        $this->info("Backup selesai! Total {$totalDocs} dokumen dari ".count($manifest['collections']).' collection.');
        $this->info("Lokasi hasil backup: {$backupDir}");

        return self::SUCCESS;
    }

    /**
     * Restore a backup directory of .ejson files to the target MongoDB database.
     */
    private function restoreDatabase(string $uri, string $databaseName, string $restorePath): int
    {
        $resolvedPath = File::isDirectory($restorePath)
            ? $restorePath
            : storage_path("app/backups/{$restorePath}");

        if (! File::isDirectory($resolvedPath)) {
            $this->error(" Direktori backup tidak ditemukan: {$resolvedPath}");

            return self::FAILURE;
        }

        $files = File::glob("{$resolvedPath}/*.ejson");
        if (count($files) === 0) {
            $this->warn("Tidak ada file .ejson ditemukan di: {$resolvedPath}");

            return self::FAILURE;
        }

        $this->info("Merestore backup ke database '{$databaseName}'...");

        try {
            $client = new Client($uri);
            $db = $client->selectDatabase($databaseName);

            foreach ($files as $file) {
                $collectionName = pathinfo($file, PATHINFO_FILENAME);
                $collection = $db->selectCollection($collectionName);

                $handle = fopen($file, 'rb');
                if ($handle === false) {
                    continue;
                }

                $count = 0;
                while (($line = fgets($handle)) !== false) {
                    $trimmed = trim($line);
                    if ($trimmed === '') {
                        continue;
                    }

                    $bson = Document::fromJSON($trimmed);
                    $docArray = $bson->toPHP(['root' => 'array', 'document' => 'array']);

                    if (isset($docArray['_id'])) {
                        $collection->replaceOne(
                            ['_id' => $docArray['_id']],
                            $bson,
                            ['upsert' => true]
                        );
                    } else {
                        $collection->insertOne($bson);
                    }

                    $count++;
                }

                fclose($handle);
                $this->line("  ✔ Collection <info>{$collectionName}</info>: {$count} dokumen berhasil di-restore.");
            }
        } catch (\Throwable $e) {
            $this->error('Gagal melakukan restore: '.$e->getMessage());

            return self::FAILURE;
        }

        $this->newLine();
        $this->info("Restore ke database '{$databaseName}' selesai!");

        return self::SUCCESS;
    }
}
