import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import MenuKitaProdSupabase from 'src/config/supabase/menu-kita-prod.config';
import MenuKitaStageSupabase from 'src/config/supabase/menu-kita-stage.config';

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid token');
    }

    const token = authHeader.split(' ')[1];
    const menuKitaProdSupabase =
      await MenuKitaProdSupabase.supabase.auth.getUser(token);

    if (!menuKitaProdSupabase.error && menuKitaProdSupabase.data.user) {
      return true;
    }

    const menuKitaStageSupabase =
      await MenuKitaStageSupabase.supabase.auth.getUser(token);

    if (!menuKitaStageSupabase.error && menuKitaStageSupabase.data.user) {
      return true;
    }

    return false;
  }
}
