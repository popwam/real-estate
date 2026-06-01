import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Sam' })
  firstName?: string;

  @ApiPropertyOptional({ example: 'Agent' })
  lastName?: string;

  @ApiPropertyOptional({ example: '+201000000001' })
  phone?: string;

  @ApiPropertyOptional({ example: 'developer_sales_manager' })
  role?: string;
}
