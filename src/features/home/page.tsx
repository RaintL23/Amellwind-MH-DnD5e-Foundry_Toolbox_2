import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { List } from "lucide-react";
import { Link } from "react-router-dom";

const ToolboxOptions = [
  {
    optionName: "Monsters List",
    optionDescription: "",
    optionIcon: List,
    optionButtonName: "Go",
    optionNavigation: "/monsters/list",
  },
  {
    optionName: "Monsters Rune List",
    optionDescription: "",
    optionIcon: List,
    optionButtonName: "Go",
    optionNavigation: "/monsters/runes/list",
  },
];

const Home = () => {
  return (
    <div>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Welcome to the Toolbox</CardTitle>
          <CardDescription>
            This toolbox, made to help you find monsters from Amellwind's
            Monster Hunter Homebrew Manual for D&D5e, is a toolbox to help you
            find monsters from Amellwind's Monster Hunter Homebrew Manual for
            D&D5e.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex space-x-4">
          {ToolboxOptions.map((option) => (
            <div key={option.optionName}>
              <Card className="w-[350px]">
                <CardTitle>
                  <div className="flex justify-center items-center space-x-2 my-3">
                    {option.optionName}
                  </div>
                </CardTitle>
                <CardDescription>{option.optionDescription}</CardDescription>
                <CardFooter>
                  <Button asChild>
                    <Link to={option.optionNavigation}>{option.optionButtonName}</Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Home;
