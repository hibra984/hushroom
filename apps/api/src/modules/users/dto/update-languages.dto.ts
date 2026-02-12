import { IsArray, IsBoolean, IsEnum, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum LanguageProficiency {
  NATIVE = 'native',
  FLUENT = 'fluent',
  ADVANCED = 'advanced',
  INTERMEDIATE = 'intermediate',
  BEGINNER = 'beginner',
}

export class LanguagePreferenceDto {
  @IsString()
  language!: string;

  @IsEnum(LanguageProficiency)
  proficiency!: LanguageProficiency;

  @IsBoolean()
  isPreferred!: boolean;
}

export class UpdateLanguagesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LanguagePreferenceDto)
  languages!: LanguagePreferenceDto[];
}
