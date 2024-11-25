export class ComparisonOperators {
  constructor(
    public code: string,
    public urlEncoding: string,
  ) {}

  static Equals = new ComparisonOperators("==", "==");
  static CaseInsensitiveEquals = new ComparisonOperators("==*", "==*");
  static CountEquals = new ComparisonOperators("#==", "%23==");
  static NotEquals = new ComparisonOperators("!=", "!=%22");
  static CaseInsensitiveNotEquals = new ComparisonOperators("!=*", "!=*%22");
  static CountNotEquals = new ComparisonOperators("#!=", "%23!=");
  static GreaterThan = new ComparisonOperators(">", "%3E");
  static CountGreaterThan = new ComparisonOperators("#>", "%23%3E");
  static LessThan = new ComparisonOperators("<", "%3C");
  static CountLessThan = new ComparisonOperators("#<", "%23%3C");
  static GreaterThanOrEqual = new ComparisonOperators(">=", "%3E=");
  static CountGreaterThanOrEqual = new ComparisonOperators("#>=", "%23%3E=");
  static LessThanOrEqual = new ComparisonOperators("<=", "%3C=");
  static CountLessThanOrEqual = new ComparisonOperators("#<=", "%23%3C=");
  static StartsWith = new ComparisonOperators("_=", "_%3D");
  static CaseInsensitiveStartsWith = new ComparisonOperators("_=*", "_=%22*");
  static DoesNotStartWith = new ComparisonOperators("!_=", "!_%3D");
  static CaseInsensitiveDoesNotStartWith = new ComparisonOperators(
    "!_=*",
    "!_=*%22",
  );
  static EndsWith = new ComparisonOperators("_-=", "_-%3D");
  static CaseInsensitiveEndsWith = new ComparisonOperators("_-=*", "_-=*%22");
  static DoesNotEndWith = new ComparisonOperators("!_-=", "!_-%3D");
  static CaseInsensitiveDoesNotEndWith = new ComparisonOperators(
    "!_-*",
    "!_-*%22",
  );
  static Contains = new ComparisonOperators("@=", "%40%3D");
  static CaseInsensitiveContains = new ComparisonOperators(
    "@=*",
    "%20%40%3D%2A%20",
  );
  static DoesNotContain = new ComparisonOperators("!@=", "!%40%3D");
  static CaseInsensitiveDoesNotContain = new ComparisonOperators(
    "!@=*",
    "!%40=%22*",
  );
  static SoundsLike = new ComparisonOperators("~~", "%7E%7E");
  static DoesNotSoundLike = new ComparisonOperators("!~", "!%7E");
  static Has = new ComparisonOperators("^$", "%5E%24");
  static CaseInsensitiveHas = new ComparisonOperators("^$*", "%5E%24%2A");
  static DoesNotHave = new ComparisonOperators("!^$", "!%5E%24");
  static CaseInsensitiveDoesNotHave = new ComparisonOperators(
    "!^$*",
    "!%5E%24%2A",
  );
  static In = new ComparisonOperators("^^", "%5E%5E");
  static CaseInsensitiveIn = new ComparisonOperators("^^*", "%5E%5E%2A");
}

export class LogicalOperator {
  constructor(
    public code: string,
    public urlEncoding: string,
  ) {}

  static And = new LogicalOperator("&&", "%26%26");
  static Or = new LogicalOperator("||", "%7C%7C");
}
