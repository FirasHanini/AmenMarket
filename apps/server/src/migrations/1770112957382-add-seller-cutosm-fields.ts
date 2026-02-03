import {MigrationInterface, QueryRunner} from "typeorm";

export class AddSellerCutosmFields1770112957382 implements MigrationInterface {

   public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "seller" ADD "customFieldsMatriculefiscal" character varying(255)`, undefined);
        await queryRunner.query(`ALTER TABLE "seller" ADD "customFieldsRibbancaire" character varying(255)`, undefined);
        await queryRunner.query(`ALTER TABLE "seller" ADD "customFieldsIsvalidatedbybank" boolean DEFAULT false`, undefined);
   }

   public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "seller" DROP COLUMN "customFieldsIsvalidatedbybank"`, undefined);
        await queryRunner.query(`ALTER TABLE "seller" DROP COLUMN "customFieldsRibbancaire"`, undefined);
        await queryRunner.query(`ALTER TABLE "seller" DROP COLUMN "customFieldsMatriculefiscal"`, undefined);
   }

}
