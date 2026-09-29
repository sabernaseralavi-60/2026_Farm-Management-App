-- Links a FieldUser (worker-app login) to an Owner account so that one
-- person's worker-app login can also open the /owner dashboard without a
-- second login. Null for every field user except the one linked owner.
ALTER TABLE "FieldUser" ADD COLUMN "ownerEmail" TEXT;
