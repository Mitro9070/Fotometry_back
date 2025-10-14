import { Injectable, NotFoundException } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { CatalogSatelliteDto, CatalogSearchResultDto } from './dto/catalog-satellite.dto';

@Injectable()
export class CatalogService {
  private catalogPath = join(process.cwd(), 'catsat', 'catsat18092025.txt');
  private catalogCache: CatalogSatelliteDto[] = null;

  /**
   * Загрузка и парсинг каталога TLE
   */
  private loadCatalog(): CatalogSatelliteDto[] {
    if (this.catalogCache) {
      return this.catalogCache;
    }

    try {
      const content = readFileSync(this.catalogPath, 'utf-8');
      const lines = content.split('\n').map(l => l.trim()).filter(l => l);
      
      const satellites: CatalogSatelliteDto[] = [];
      
      for (let i = 0; i < lines.length; i += 3) {
        if (i + 2 >= lines.length) break;
        
        const nameLine = lines[i];
        const line1 = lines[i + 1];
        const line2 = lines[i + 2];
        
        // Проверка формата
        if (!nameLine.startsWith('0 ') || !line1.startsWith('1 ') || !line2.startsWith('2 ')) {
          continue;
        }
        
        const satellite = this.parseTLE(nameLine, line1, line2);
        if (satellite) {
          satellites.push(satellite);
        }
      }
      
      this.catalogCache = satellites;
      return satellites;
    } catch (error) {
      console.error('Error loading catalog:', error);
      return [];
    }
  }

  /**
   * Парсинг TLE строк
   */
  private parseTLE(nameLine: string, line1: string, line2: string): CatalogSatelliteDto {
    try {
      const name = nameLine.substring(2).trim();
      const noradId = line1.substring(2, 7).trim();
      const intlDesignator = line1.substring(9, 17).trim();
      
      // Парсинг параметров орбиты из line2
      const inclination = parseFloat(line2.substring(8, 16).trim());
      const raan = parseFloat(line2.substring(17, 25).trim());
      const eccentricityStr = line2.substring(26, 33).trim();
      const eccentricity = parseFloat('0.' + eccentricityStr);
      const argOfPerigee = parseFloat(line2.substring(34, 42).trim());
      const meanAnomaly = parseFloat(line2.substring(43, 51).trim());
      const meanMotion = parseFloat(line2.substring(52, 63).trim());
      
      // Эпоха из line1
      const epochYear = line1.substring(18, 20).trim();
      const epochDay = line1.substring(20, 32).trim();
      const epoch = `${epochYear}.${epochDay}`;

      return {
        name,
        noradId,
        intlDesignator,
        line1,
        line2,
        epoch,
        inclination,
        raan,
        eccentricity,
        argOfPerigee,
        meanAnomaly,
        meanMotion,
      };
    } catch (error) {
      console.error('Error parsing TLE:', error);
      return null;
    }
  }

  /**
   * Поиск спутников по названию или NORAD номеру
   * @param query Строка поиска (минимум 3 символа)
   */
  searchSatellites(query: string): CatalogSearchResultDto {
    if (!query || query.length < 3) {
      return { total: 0, satellites: [] };
    }

    const catalog = this.loadCatalog();
    const searchQuery = query.toLowerCase();
    
    const results = catalog.filter(sat => 
      sat.name.toLowerCase().includes(searchQuery) || 
      sat.noradId.includes(query)
    );

    return {
      total: results.length,
      satellites: results.slice(0, 50), // Ограничиваем 50 результатами
    };
  }

  /**
   * Получение спутника по точному NORAD ID
   */
  getSatelliteByNoradId(noradId: string): CatalogSatelliteDto {
    const catalog = this.loadCatalog();
    const satellite = catalog.find(sat => sat.noradId === noradId);
    
    if (!satellite) {
      throw new NotFoundException(`Satellite with NORAD ID ${noradId} not found in catalog`);
    }
    
    return satellite;
  }

  /**
   * Получение детальной информации по индексу в каталоге
   */
  getSatelliteByIndex(index: number): CatalogSatelliteDto {
    const catalog = this.loadCatalog();
    
    if (index < 0 || index >= catalog.length) {
      throw new NotFoundException(`Satellite at index ${index} not found`);
    }
    
    return catalog[index];
  }

  /**
   * Получение всех спутников из каталога (с пагинацией)
   */
  getAllSatellites(page: number = 1, limit: number = 100): CatalogSearchResultDto {
    const catalog = this.loadCatalog();
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return {
      total: catalog.length,
      satellites: catalog.slice(start, end),
    };
  }
}

