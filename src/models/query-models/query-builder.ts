import { ComparisonOperators, LogicalOperator } from "./operators";

export default class QueryBuilder {
  private encodeURi: boolean;
  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  private query: string = "";

  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  constructor(encodeUri: boolean = true, addFilterStatement = true) {
    this.encodeURi = encodeUri;
    if (addFilterStatement) this.query += "Filters=";
  }

  private addCondition(condition: string): QueryBuilder {
    this.query += condition;
    return this;
  }

  private stringifyValue(value: string | number | boolean): string {
    return typeof value === "string" ? `"${value}"` : value.toString();
  }

  private createCondition(
    operator: ComparisonOperators,
  ): (property: string, value: string | number | boolean) => QueryBuilder {
    return (property, value) =>
      this.addCondition(this.buildCondition(property, operator, value));
  }

  private buildCondition(
    property: string,
    operator: ComparisonOperators,
    value: string | number | boolean,
  ): string {
    // value = typeof value !== "number" ? this.stringifyValue(value) : value;
    return `${property}${operator.urlEncoding}${value}`;
  }

  private buildDateCondition(
    property: string,
    operator: ComparisonOperators,
    value: string | number | boolean,
  ): string {
    if (typeof value === "string") {
      return `${property}${ComparisonOperators.GreaterThanOrEqual.urlEncoding}"${value}T00:00:00"${LogicalOperator.And.urlEncoding}${property}${ComparisonOperators.LessThanOrEqual.urlEncoding}"${value}T23:59:59"`;
    } else {
      return this.buildCondition(property, operator, value);
    }
  }

  public createTempCondition(
    property: string,
    type: string,
    operator: ComparisonOperators,
    value: string | number | boolean,
  ): void {
    if (type == "date") {
      this.addCondition(this.buildDateCondition(property, operator, value));
    } else {
      this.addCondition(this.buildCondition(property, operator, value));
    }
  }

  private buildArrayCondition(
    property: string,
    operator: ComparisonOperators,
    values: (string | number)[],
  ): string {
    const valueString = values
      .map((val) => this.stringifyValue(val))
      .join(", ");
    return `${property}${operator.urlEncoding}[${valueString}]`;
  }

  private createArrayCondition(
    operator: ComparisonOperators,
  ): (property: string, values: (string | number)[]) => QueryBuilder {
    return (property, values) =>
      this.addCondition(this.buildArrayCondition(property, operator, values));
  }

  private addOperator(operator: LogicalOperator): this {
    this.query = this.query.trim() + `${operator.urlEncoding}`;
    return this;
  }

  private appendQuery(value: string): this {
    this.query += value;
    return this;
  }

  equals = this.createCondition(ComparisonOperators.Equals);
  notEquals = this.createCondition(ComparisonOperators.NotEquals);
  greaterThan = this.createCondition(ComparisonOperators.GreaterThan);
  lessThan = this.createCondition(ComparisonOperators.LessThan);
  greaterThanOrEqual = this.createCondition(
    ComparisonOperators.GreaterThanOrEqual,
  );
  lessThanOrEqual = this.createCondition(ComparisonOperators.LessThanOrEqual);

  startsWith = this.createCondition(ComparisonOperators.StartsWith);
  doesNotStartWith = this.createCondition(ComparisonOperators.DoesNotStartWith);
  endsWith = this.createCondition(ComparisonOperators.EndsWith);
  doesNotEndWith = this.createCondition(ComparisonOperators.DoesNotEndWith);
  contains = this.createCondition(ComparisonOperators.Contains);
  doesNotContain = this.createCondition(ComparisonOperators.DoesNotContain);
  soundsLike = this.createCondition(ComparisonOperators.SoundsLike);
  doesNotSoundLike = this.createCondition(ComparisonOperators.DoesNotSoundLike);
  has = this.createCondition(ComparisonOperators.Has);
  doesNotHave = this.createCondition(ComparisonOperators.DoesNotHave);

  endsWithCaseInsensitive = this.createCondition(
    ComparisonOperators.CaseInsensitiveEndsWith,
  );
  doesNotEndWithCaseInsensitive = this.createCondition(
    ComparisonOperators.CaseInsensitiveDoesNotEndWith,
  );
  containsCaseInsensitive = this.createCondition(
    ComparisonOperators.CaseInsensitiveContains,
  );
  doesNotContainCaseInsensitive = this.createCondition(
    ComparisonOperators.CaseInsensitiveDoesNotContain,
  );
  hasCaseInsensitive = this.createCondition(
    ComparisonOperators.CaseInsensitiveHas,
  );
  doesNotHaveCaseInsensitive = this.createCondition(
    ComparisonOperators.CaseInsensitiveDoesNotHave,
  );

  countGreaterThan = this.createCondition(ComparisonOperators.CountGreaterThan);
  countLessThan = this.createCondition(ComparisonOperators.CountLessThan);
  countGreaterThanOrEqual = this.createCondition(
    ComparisonOperators.CountGreaterThanOrEqual,
  );
  countLessThanOrEqual = this.createCondition(
    ComparisonOperators.CountLessThanOrEqual,
  );

  equalsCaseCount = this.createCondition(ComparisonOperators.CountEquals);
  notEqualsCaseCount = this.createCondition(ComparisonOperators.CountNotEquals);
  greaterThanCaseCount = this.createCondition(
    ComparisonOperators.CountGreaterThan,
  );
  lessThanCaseCount = this.createCondition(ComparisonOperators.CountLessThan);
  greaterThanOrEqualCaseCount = this.createCondition(
    ComparisonOperators.CountGreaterThanOrEqual,
  );
  lessThanOrEqualCaseCount = this.createCondition(
    ComparisonOperators.CountLessThanOrEqual,
  );

  equalsCaseInsensitive = this.createCondition(
    ComparisonOperators.CaseInsensitiveEquals,
  );
  notEqualsCaseInsensitive = this.createCondition(
    ComparisonOperators.CaseInsensitiveNotEquals,
  );
  startsWithCaseInsensitive = this.createCondition(
    ComparisonOperators.CaseInsensitiveStartsWith,
  );
  doesNotStartWithCaseInsensitive = this.createCondition(
    ComparisonOperators.CaseInsensitiveDoesNotStartWith,
  );
  in = this.createArrayCondition(ComparisonOperators.In);
  inCaseInsensitive = this.createArrayCondition(
    ComparisonOperators.CaseInsensitiveIn,
  );

  and(): this {
    return this.addOperator(LogicalOperator.And);
  }

  or(): this {
    return this.addOperator(LogicalOperator.Or);
  }

  openParen(): this {
    return this.appendQuery("(");
  }

  closeParen(): this {
    return this.appendQuery(")");
  }

  build(): string {
    this.query = this.query.trim();
    return this.encodeURi ? encodeURIComponent(this.query) : this.query;
  }
}

export { QueryBuilder };
