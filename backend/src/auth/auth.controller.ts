import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleLoginDto } from './dto/google-login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google')
  loginComGoogle(@Body() dto: GoogleLoginDto) {
    return this.authService.loginComGoogle(dto.credential);
  }
}
