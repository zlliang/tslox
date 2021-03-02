"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AstPrinter = exports.ClassStmt = exports.ReturnStmt = exports.FunctionStmt = exports.WhileStmt = exports.IfStmt = exports.BlockStmt = exports.ThisExpr = exports.SetExpr = exports.GetExpr = exports.VarStmt = exports.PrintStmt = exports.ExpressionStmt = exports.CallExpr = exports.LogicalExpr = exports.AssignExpr = exports.VariableExpr = exports.UnaryExpr = exports.LiteralExpr = exports.GroupingExpr = exports.BinaryExpr = void 0;
class BinaryExpr {
    constructor(left, operator, right) {
        this.left = left;
        this.operator = operator;
        this.right = right;
    }
    accept(visitor) {
        return visitor.visitBinaryExpr(this);
    }
}
exports.BinaryExpr = BinaryExpr;
class GroupingExpr {
    constructor(expression) {
        this.expression = expression;
    }
    accept(visitor) {
        return visitor.visitGroupingExpr(this);
    }
}
exports.GroupingExpr = GroupingExpr;
class LiteralExpr {
    constructor(value) {
        this.value = value;
    }
    accept(visitor) {
        return visitor.visitLiteralExpr(this);
    }
}
exports.LiteralExpr = LiteralExpr;
class UnaryExpr {
    constructor(operator, right) {
        this.operator = operator;
        this.right = right;
    }
    accept(visitor) {
        return visitor.visitUnaryExpr(this);
    }
}
exports.UnaryExpr = UnaryExpr;
class VariableExpr {
    constructor(name) {
        this.name = name;
    }
    accept(visitor) {
        return visitor.visitVariableExpr(this);
    }
}
exports.VariableExpr = VariableExpr;
class AssignExpr {
    constructor(name, value) {
        this.name = name;
        this.value = value;
    }
    accept(visitor) {
        return visitor.visitAssignExpr(this);
    }
}
exports.AssignExpr = AssignExpr;
class LogicalExpr {
    constructor(left, operator, right) {
        this.left = left;
        this.operator = operator;
        this.right = right;
    }
    accept(visitor) {
        return visitor.visitLogicalExpr(this);
    }
}
exports.LogicalExpr = LogicalExpr;
class CallExpr {
    constructor(callee, paren, args) {
        this.callee = callee;
        this.paren = paren;
        this.args = args;
    }
    accept(visitor) {
        return visitor.visitCallExpr(this);
    }
}
exports.CallExpr = CallExpr;
class ExpressionStmt {
    constructor(expression) {
        this.expression = expression;
    }
    accept(visitor) {
        return visitor.visitExpressionStmt(this);
    }
}
exports.ExpressionStmt = ExpressionStmt;
class PrintStmt {
    constructor(expression) {
        this.expression = expression;
    }
    accept(visitor) {
        return visitor.visitPrintStmt(this);
    }
}
exports.PrintStmt = PrintStmt;
class VarStmt {
    constructor(name, initializer) {
        this.name = name;
        this.initializer = initializer;
    }
    accept(visitor) {
        return visitor.visitVarStmt(this);
    }
}
exports.VarStmt = VarStmt;
class GetExpr {
    constructor(object, name) {
        this.object = object;
        this.name = name;
    }
    accept(visitor) {
        return visitor.visitGetExpr(this);
    }
}
exports.GetExpr = GetExpr;
class SetExpr {
    constructor(object, name, value) {
        this.object = object;
        this.name = name;
        this.value = value;
    }
    accept(visitor) {
        return visitor.visitSetExpr(this);
    }
}
exports.SetExpr = SetExpr;
class ThisExpr {
    constructor(keyword) {
        this.keyword = keyword;
    }
    accept(visitor) {
        return visitor.visitThisExpr(this);
    }
}
exports.ThisExpr = ThisExpr;
class BlockStmt {
    constructor(statements) {
        this.statements = statements;
    }
    accept(visitor) {
        return visitor.visitBlockStmt(this);
    }
}
exports.BlockStmt = BlockStmt;
class IfStmt {
    constructor(condition, thenBranch, elseBranch) {
        this.condition = condition;
        this.thenBranch = thenBranch;
        this.elseBranch = elseBranch;
    }
    accept(visitor) {
        return visitor.visitIfStmt(this);
    }
}
exports.IfStmt = IfStmt;
class WhileStmt {
    constructor(condition, body) {
        this.condition = condition;
        this.body = body;
    }
    accept(visitor) {
        return visitor.visitWhileStmt(this);
    }
}
exports.WhileStmt = WhileStmt;
class FunctionStmt {
    constructor(name, params, body) {
        this.name = name;
        this.params = params;
        this.body = body;
    }
    accept(visitor) {
        return visitor.visitFunctionStmt(this);
    }
}
exports.FunctionStmt = FunctionStmt;
class ReturnStmt {
    constructor(keyword, value) {
        this.keyword = keyword;
        this.value = value;
    }
    accept(visitor) {
        return visitor.visitReturnStmt(this);
    }
}
exports.ReturnStmt = ReturnStmt;
class ClassStmt {
    constructor(name, methods) {
        this.name = name;
        this.methods = methods;
    }
    accept(visitor) {
        return visitor.visitClassStmt(this);
    }
}
exports.ClassStmt = ClassStmt;
class AstPrinter {
    // Print AST as S-expressions
    stringify(target) {
        if (target instanceof Array) {
            return target.map((stmt) => stmt.accept(this)).join('\n');
        }
        else {
            return target.accept(this);
        }
    }
    parenthesize(name, ...exprs) {
        let result = '';
        result += `(${name}`;
        for (const expr of exprs) {
            result += ` ${expr.accept(this)}`;
        }
        result += ')';
        return result;
    }
    indent(lines) {
        return lines
            .split('\n')
            .map((line) => '  ' + line)
            .join('\n');
    }
    visitBinaryExpr(expr) {
        return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
    }
    visitGroupingExpr(expr) {
        return this.parenthesize('group', expr.expression);
    }
    visitLiteralExpr(expr) {
        if (expr.value === null)
            return 'nil';
        if (typeof expr.value === 'string')
            return `"${expr.value}"`;
        return expr.value.toString();
    }
    visitUnaryExpr(expr) {
        return this.parenthesize(expr.operator.lexeme, expr.right);
    }
    visitVariableExpr(expr) {
        return expr.name.lexeme;
    }
    visitAssignExpr(expr) {
        const name = new VariableExpr(expr.name);
        return this.parenthesize('assign', name, expr.value);
    }
    visitLogicalExpr(expr) {
        return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
    }
    visitCallExpr(expr) {
        return this.parenthesize('call', expr.callee, ...expr.args);
    }
    visitThisExpr(expr) {
        return this.parenthesize(expr.keyword.lexeme);
    }
    visitPrintStmt(stmt) {
        return this.parenthesize('print', stmt.expression);
    }
    visitExpressionStmt(stmt) {
        return this.parenthesize('expression', stmt.expression);
    }
    visitVarStmt(stmt) {
        const name = new VariableExpr(stmt.name);
        if (stmt.initializer) {
            return this.parenthesize('var', name, stmt.initializer);
        }
        else {
            return this.parenthesize('var', name);
        }
    }
    visitGetExpr(expr) {
        return this.parenthesize(`get ${expr.name.lexeme}`, expr.object);
    }
    visitSetExpr(expr) {
        return this.parenthesize(`set ${expr.name.lexeme}`, expr.object, expr.value);
    }
    visitBlockStmt(stmt) {
        let result = '(block';
        stmt.statements.forEach((innerStmt) => {
            result += '\n' + this.indent(this.stringify(innerStmt));
        });
        result += ')';
        return result;
    }
    visitIfStmt(stmt) {
        let result = `(if ${this.stringify(stmt.condition)}\n`;
        const thenBranchResult = this.stringify(stmt.thenBranch);
        result += this.indent(thenBranchResult);
        if (stmt.elseBranch !== null) {
            result += '\n';
            const elseBranchResult = this.stringify(stmt.elseBranch);
            result += this.indent(elseBranchResult);
        }
        result += ')';
        return result;
    }
    visitWhileStmt(stmt) {
        let result = `(while ${this.stringify(stmt.condition)}\n`;
        const bodyResult = this.stringify(stmt.body);
        result += this.indent(bodyResult) + ')';
        return result;
    }
    visitFunctionStmt(stmt) {
        const paramsResult = stmt.params.length > 0
            ? ` (params ${stmt.params.map((p) => p.lexeme).join(' ')})`
            : '';
        let result = `(fun ${stmt.name.lexeme}${paramsResult}\n`;
        result += this.indent(this.stringify(new BlockStmt(stmt.body))) + ')';
        return result;
    }
    visitReturnStmt(stmt) {
        return stmt.value !== null
            ? this.parenthesize(stmt.keyword.lexeme, stmt.value)
            : this.parenthesize(stmt.keyword.lexeme);
    }
    visitClassStmt(stmt) {
        let result = `(class ${stmt.name.lexeme}`;
        stmt.methods.forEach((method) => {
            result += '\n' + this.indent(this.stringify(method));
        });
        result += ')';
        return result;
    }
}
exports.AstPrinter = AstPrinter;
