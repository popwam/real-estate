import { BadRequestException } from '@nestjs/common';
import { requireCanonicalOrganizationType } from './organization-types';

describe('organization type contract', () => {
  it('accepts the canonical BROKERAGE code', () => {
    expect(requireCanonicalOrganizationType('BROKERAGE')).toBe('BROKERAGE');
  });

  it.each(['Brokerage', 'brokerage', 'شركة وساطة عقارية', '', undefined])(
    'rejects non-canonical value %p with a structured response',
    (value) => {
      try {
        requireCanonicalOrganizationType(value);
        throw new Error('Expected validation to fail');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).getResponse()).toMatchObject({
          statusCode: 400,
          code: 'ORGANIZATION_TYPE_INVALID',
          message: 'Organization type is invalid.',
          allowedValues: ['PLATFORM', 'DEVELOPER', 'BROKERAGE', 'INDIVIDUAL_BROKER'],
        });
      }
    },
  );
});
