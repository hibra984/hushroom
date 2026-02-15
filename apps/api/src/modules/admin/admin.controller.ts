import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateAbuseReportDto } from './dto/create-abuse-report.dto';

@Controller({ path: 'admin', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getPlatformStats();
  }

  @Get('users')
  getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getUsers(
      page ? +page : 1,
      limit ? +limit : 20,
      search,
    );
  }

  @Patch('users/:id')
  updateUser(
    @Param('id') id: string,
    @Body() data: { isActive?: boolean; role?: string },
  ) {
    return this.adminService.updateUser(id, data);
  }

  @Get('companions/pending')
  getPendingCompanions() {
    return this.adminService.getPendingCompanions();
  }

  @Post('companions/:id/approve')
  approveCompanion(@Param('id') id: string) {
    return this.adminService.approveCompanion(id);
  }

  @Post('companions/:id/suspend')
  suspendCompanion(@Param('id') id: string) {
    return this.adminService.suspendCompanion(id);
  }

  @Get('sessions')
  getSessions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getSessions(
      page ? +page : 1,
      limit ? +limit : 20,
      status,
    );
  }

  @Get('payments')
  getPayments(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getPayments(
      page ? +page : 1,
      limit ? +limit : 20,
      status,
    );
  }

  @Get('reports')
  getReports(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getAbuseReports(
      page ? +page : 1,
      limit ? +limit : 20,
      status,
    );
  }

  @Post('reports/:id/resolve')
  resolveReport(
    @Param('id') id: string,
    @Body() body: { adminNotes: string },
  ) {
    return this.adminService.resolveAbuseReport(id, body.adminNotes);
  }

  @Post('reports/:id/dismiss')
  dismissReport(
    @Param('id') id: string,
    @Body() body: { adminNotes: string },
  ) {
    return this.adminService.dismissAbuseReport(id, body.adminNotes);
  }

  @Get('audit-logs')
  getAuditLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
  ) {
    return this.adminService.getAuditLogs(
      page ? +page : 1,
      limit ? +limit : 50,
      userId,
      action,
    );
  }
}

// Separate controller for user-facing abuse reports (no admin role required)
@Controller({ path: 'reports', version: '1' })
@UseGuards(JwtAuthGuard)
export class AbuseReportsController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  async createReport(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateAbuseReportDto,
  ) {
    return this.adminService.createAbuseReport(userId, dto);
  }
}
