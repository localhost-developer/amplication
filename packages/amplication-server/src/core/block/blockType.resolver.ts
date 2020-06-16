import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { IBlock } from 'src/models';
import { FindOneWithVersionArgs } from 'src/dto';
import { AuthorizeContext } from 'src/decorators/authorizeContext.decorator';
import { AuthorizableResourceParameter } from 'src/enums/AuthorizableResourceParameter';
import { BlockTypeService } from './blockType.service';
import { FindManyBlockArgs, CreateBlockArgs } from '../block/dto';

type Constructor<T> = {
  new (...args: any): T;
};

export function BlockTypeResolver<
  T extends IBlock,
  FindManyArgs extends FindManyBlockArgs,
  CreateArgs extends CreateBlockArgs
>(
  classRef: Constructor<T>,
  findManyName: string,
  findManyArgsRef: Constructor<FindManyArgs>,
  createName: string | null = null,
  createArgsRef: Constructor<CreateArgs> | null = null
): any {
  @Resolver({ isAbstract: true })
  abstract class BaseResolverHost {
    service: BlockTypeService<T, FindManyArgs, CreateArgs>;

    @Query(() => classRef, {
      name: classRef.name,
      nullable: true,
      description: undefined
    })
    @AuthorizeContext(AuthorizableResourceParameter.BlockId, 'where.id')
    async findOne(@Args() args: FindOneWithVersionArgs): Promise<T | null> {
      return this.service.findOne(args);
    }

    @Query(() => [classRef], {
      name: findManyName,
      nullable: false,
      description: undefined
    })
    @AuthorizeContext(AuthorizableResourceParameter.AppId, 'where.app.id')
    async findMany(
      @Args({ type: () => findManyArgsRef }) args: FindManyArgs
    ): Promise<T[]> {
      return this.service.findMany(args);
    }
  }

  if (createName) {
    @Resolver({ isAbstract: true })
    abstract class BaseResolverHostWithCreate extends BaseResolverHost {
      @Mutation(() => classRef, {
        name: createName,
        nullable: false,
        description: undefined
      })
      @AuthorizeContext(
        AuthorizableResourceParameter.AppId,
        'data.app.connect.id'
      )
      async [createName](
        @Args({ type: () => createArgsRef }) args: CreateArgs
      ): Promise<T> {
        return this.service.create(args);
      }
    }
    return BaseResolverHostWithCreate;
  }

  return BaseResolverHost;
}
