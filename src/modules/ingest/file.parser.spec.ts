import { Test, TestingModule } from '@nestjs/testing';
import { FileParser } from './file.parser';
import { LoggerService } from '../../common/logger/logger.service';

describe('FileParser', () => {
  let service: FileParser;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileParser,
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            logError: jest.fn(),
            logWarn: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FileParser>(FileParser);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('parse', () => {
    it('should parse a valid observation file', () => {
      const mockFileContent = `
ЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖЖ
ПУНКТ 0021
Астрон_широта 45.5359
Долгота 73.3601
Высота 306.0
ДАТА 25/09 - 2006
НОМЕР 000216 (разность со Всемирным временем 6 час)
Э Т А Л О Н : сигнал за 10.0 сек 2441.0
Фильтр Зв_вел А─ekst В─ekst ekst сигма
'B' 11.59 0.000 0.0000 0.000 0.000
'V' 11.63 0.000 0.0000 0.000 0.000
'R' 10.78 0.000 0.0006 0.003 0.000
КООРДИНАТЫ:
Час_угол Дельта Время
1.25590 -15.1310 19.30000
1.25550 -15.3759 20.00000
1.25460 -15.5353 20.30000
1.25330 -16.0032 21.00000
ПЕРИОД УСРЕДНЕНИЯ = 10.00 сек
Фильтр Начало_эксп Интерв,мин шаг,сек фон_за_30.0_сек число_отсч
'B' 23.25550 0.80 0.100 3995.0 480
'V' 23.26470 0.80 0.100 8059.0 480
'R' 23.27410 0.80 0.100 7354.0 480
      `;

      const result = service.parse(Buffer.from(mockFileContent, 'utf8'), { originalName: 'test.E' });

      expect(result).toBeDefined();
      expect(result.station).toBeDefined();
             expect(result.station.code).toBe('0021');
       expect(result.station.latitudeDeg).toBe(45.5359);
       expect(result.station.longitudeDeg).toBe(73.3601);
       expect(result.station.altitudeM).toBe(306.0);
      expect(result.obsDate).toBe('2006-09-25');
      expect(result.obsNumber).toBe('000216');
      expect(result.utcOffsetHours).toBe(6);
      expect(result.coordinates).toHaveLength(4);
      expect(result.filters).toHaveLength(3);
      expect(result.filters[0].experiment.countNumber).toBe(480);
      expect(result.filters[0].rawSignals).toHaveLength(0);
      expect(result.filters[0].instrumentalMagnitudes).toHaveLength(0);
    });
  });
});
