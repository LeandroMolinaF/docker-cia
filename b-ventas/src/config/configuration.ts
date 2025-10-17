import * as Joi from 'joi';
import 'dotenv/config';

interface EnvVars {
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
}

const envSchema = Joi.object<EnvVars>({
  PORT: Joi.number().default(50051),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
}).unknown();

const validationResult: Joi.ValidationResult<EnvVars> = envSchema.validate(
  process.env,
  {
    abortEarly: false,
  },
);

if (validationResult.error) {
  throw new Error(`Config validation error: ${validationResult.error.message}`);
}

const validatedEnvConfig = validationResult.value;

export const envs = {
  port: validatedEnvConfig.PORT,
  database_url: validatedEnvConfig.DATABASE_URL,
  jwt_secret: validatedEnvConfig.JWT_SECRET,
};
