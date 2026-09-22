import { ConflictException, Injectable } from '@nestjs/common';

import { hash } from 'argon2';

import { UserRepository } from '../../domain/repositories/user.repository';

interface CreateInput {
  email: string;
  password: string;
  fullName: string;
}

@Injectable()
export class CreateUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: CreateInput) {
    const existingUser = await this.userRepository.findByEmail(input.email);

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await hash(input.password);

    const user = await this.userRepository.create({
      email: input.email,
      passwordHash,
      fullName: input.fullName,
    });

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      emailVerified: user.emailVerified,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
